import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { CodegenTableListQueryDto } from './codegen.dto';

interface DatabaseTableRow {
  tableName: string;
  tableComment: string | null;
}

interface DatabaseColumnRow {
  columnName: string;
  dataType: string;
  columnType: string;
  isNullable: 'YES' | 'NO';
  columnKey: string | null;
  extra: string | null;
  columnDefault: string | null;
  columnComment: string | null;
  ordinalPosition: number | bigint;
}

interface TableColumnRow extends DatabaseColumnRow {
  tableName: string;
}

interface InferredTableMetadata {
  tableName: string;
  tableComment: string | null;
  moduleName: string;
  businessName: string | null;
  className: string | null;
  primaryKey: string | null;
}

interface InferredColumnMetadata {
  columnName: string;
  propertyName: string;
  columnComment: string | null;
  tsType: string;
  formType: string;
  queryType: string;
  listVisible: boolean;
  sort: number;
}

interface ResolvedMappingColumn extends InferredColumnMetadata {
  dataType: string;
  columnType: string;
  nullable: boolean;
  primaryKey: boolean;
  hasDefault: boolean;
  autoIncrement: boolean;
}

interface ResolvedTableMapping extends InferredTableMetadata {
  source: 'INFERRED' | 'SYNCED';
  columns: ResolvedMappingColumn[];
}

const EXCLUDED_TABLES = new Set([
  '_prisma_migrations',
  'codegen_tables',
  'codegen_columns'
]);

@Injectable()
export class CodegenService {
  constructor(private readonly prisma: PrismaService) {}

  async listTables(query: CodegenTableListQueryDto) {
    const keyword = query.keyword?.trim().toLowerCase();
    const tables = await this.loadDatabaseTables();
    const visibleTables = tables.filter((item) => !EXCLUDED_TABLES.has(item.tableName));
    const filteredTables = keyword
      ? visibleTables.filter((item) =>
          item.tableName.toLowerCase().includes(keyword) ||
          (item.tableComment ?? '').toLowerCase().includes(keyword)
        )
      : visibleTables;

    if (filteredTables.length === 0) {
      return successResponse({
        records: []
      });
    }

    const tableNames = filteredTables.map((item) => item.tableName);
    const metadata = await this.prisma.codegenTable.findMany({
      where: {
        tableName: {
          in: tableNames
        }
      }
    });
    const metadataByTableName = new Map(
      metadata.map((item) => [item.tableName, item])
    );
    const columns = await this.loadColumnsForTables(tableNames);
    const columnCountByTableName = columns.reduce((result, item) => {
      result.set(item.tableName, (result.get(item.tableName) ?? 0) + 1);
      return result;
    }, new Map<string, number>());

    return successResponse({
      records: filteredTables.map((item) => {
        const inferred = this.inferTableMetadata(
          item,
          columns.filter((column) => column.tableName === item.tableName)
        );
        const stored = metadataByTableName.get(item.tableName);

        return {
          tableName: item.tableName,
          tableComment: stored?.tableComment ?? inferred.tableComment,
          moduleName: stored?.moduleName ?? inferred.moduleName,
          className: stored?.className ?? inferred.className,
          primaryKey: stored?.primaryKey ?? inferred.primaryKey,
          columnCount: columnCountByTableName.get(item.tableName) ?? 0,
          synced: Boolean(stored)
        };
      })
    });
  }

  async syncTable(tableName: string) {
    const normalizedTableName = this.normalizeTableName(tableName);
    const table = await this.loadDatabaseTableOrThrow(normalizedTableName);
    const columns = await this.loadTableColumns(normalizedTableName);
    const inferredTable = this.inferTableMetadata(table, columns);
    const inferredColumns = columns.map((item) => this.inferColumnMetadata(item));

    await this.prisma.$transaction(async (tx) => {
      const storedTable = await tx.codegenTable.upsert({
        where: {
          tableName: normalizedTableName
        },
        create: {
          tableName: inferredTable.tableName,
          tableComment: inferredTable.tableComment,
          moduleName: inferredTable.moduleName,
          businessName: inferredTable.businessName,
          className: inferredTable.className,
          primaryKey: inferredTable.primaryKey
        },
        update: {
          tableComment: inferredTable.tableComment,
          moduleName: inferredTable.moduleName,
          businessName: inferredTable.businessName,
          className: inferredTable.className,
          primaryKey: inferredTable.primaryKey
        }
      });

      await tx.codegenColumn.deleteMany({
        where: {
          tableId: storedTable.id,
          columnName: {
            notIn: inferredColumns.map((item) => item.columnName)
          }
        }
      });

      for (const column of inferredColumns) {
        await tx.codegenColumn.upsert({
          where: {
            tableId_columnName: {
              tableId: storedTable.id,
              columnName: column.columnName
            }
          },
          create: {
            tableId: storedTable.id,
            ...column
          },
          update: {
            propertyName: column.propertyName,
            columnComment: column.columnComment,
            tsType: column.tsType,
            formType: column.formType,
            queryType: column.queryType,
            listVisible: column.listVisible,
            sort: column.sort
          }
        });
      }
    });

    return successResponse(
      this.buildTableMappingResponse(
        table,
        columns,
        {
          ...inferredTable,
          source: 'SYNCED'
        },
        inferredColumns
      )
    );
  }

  async mapping(tableName: string) {
    return successResponse(await this.resolveTableMapping(tableName));
  }

  async backendTemplates(tableName: string) {
    const mapping = await this.resolveTableMapping(tableName);
    const modulePath = mapping.moduleName;
    const fileBaseName = this.toFileBaseName(mapping.moduleName);

    return successResponse({
      tableName: mapping.tableName,
      moduleName: mapping.moduleName,
      className: mapping.className,
      files: [
        {
          type: 'dto',
          path: `src/modules/${modulePath}/${fileBaseName}.dto.ts`,
          content: this.buildDtoTemplate(mapping)
        },
        {
          type: 'service',
          path: `src/modules/${modulePath}/${fileBaseName}.service.ts`,
          content: this.buildServiceTemplate(mapping)
        },
        {
          type: 'controller',
          path: `src/modules/${modulePath}/${fileBaseName}.controller.ts`,
          content: this.buildControllerTemplate(mapping)
        },
        {
          type: 'module',
          path: `src/modules/${modulePath}/${fileBaseName}.module.ts`,
          content: this.buildModuleTemplate(mapping)
        }
      ]
    });
  }

  async frontendMeta(tableName: string) {
    const mapping = await this.resolveTableMapping(tableName);
    const visibleColumns = mapping.columns
      .filter((item) => item.listVisible && item.formType !== 'hidden')
      .map((item) => this.toFrontendField(item, false));
    const formFields = mapping.columns
      .filter((item) => !item.primaryKey && item.formType !== 'hidden')
      .map((item) => this.toFrontendField(item, true));
    const searchFields = mapping.columns
      .filter((item) => item.queryType !== 'none' && item.formType !== 'hidden')
      .map((item) => ({
        columnName: item.columnName,
        field: item.propertyName,
        label: item.columnComment ?? this.toTitleCase(item.columnName),
        queryType: item.queryType,
        component: this.toFrontendComponent(item.formType)
      }));

    return successResponse({
      tableName: mapping.tableName,
      moduleName: mapping.moduleName,
      pageTitle: mapping.businessName ?? mapping.className,
      apiBasePath: `/api/${mapping.moduleName}`,
      tableColumns: visibleColumns,
      searchFields,
      formFields
    });
  }

  private async loadDatabaseTables() {
    return this.prisma.$queryRaw<DatabaseTableRow[]>`
      SELECT
        TABLE_NAME AS tableName,
        NULLIF(TABLE_COMMENT, '') AS tableComment
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME ASC
    `;
  }

  private async loadColumnsForTables(tableNames: string[]) {
    if (tableNames.length === 0) {
      return [] as TableColumnRow[];
    }

    return this.prisma.$queryRaw<TableColumnRow[]>(
      Prisma.sql`
        SELECT
          TABLE_NAME AS tableName,
          COLUMN_NAME AS columnName,
          DATA_TYPE AS dataType,
          COLUMN_TYPE AS columnType,
          IS_NULLABLE AS isNullable,
          COLUMN_KEY AS columnKey,
          EXTRA AS extra,
          COLUMN_DEFAULT AS columnDefault,
          NULLIF(COLUMN_COMMENT, '') AS columnComment,
          ORDINAL_POSITION AS ordinalPosition
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN (${Prisma.join(tableNames)})
        ORDER BY TABLE_NAME ASC, ORDINAL_POSITION ASC
      `
    );
  }

  private async loadDatabaseTableOrThrow(tableName: string) {
    if (EXCLUDED_TABLES.has(tableName)) {
      throw new BusinessException(BUSINESS_ERROR_CODES.CODEGEN_TABLE_NOT_FOUND);
    }

    const tables = await this.prisma.$queryRaw<DatabaseTableRow[]>`
      SELECT
        TABLE_NAME AS tableName,
        NULLIF(TABLE_COMMENT, '') AS tableComment
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
        AND TABLE_NAME = ${tableName}
      LIMIT 1
    `;
    const table = tables[0];

    if (!table) {
      throw new BusinessException(BUSINESS_ERROR_CODES.CODEGEN_TABLE_NOT_FOUND);
    }

    return table;
  }

  private loadTableColumns(tableName: string) {
    return this.prisma.$queryRaw<DatabaseColumnRow[]>`
      SELECT
        COLUMN_NAME AS columnName,
        DATA_TYPE AS dataType,
        COLUMN_TYPE AS columnType,
        IS_NULLABLE AS isNullable,
        COLUMN_KEY AS columnKey,
        EXTRA AS extra,
        COLUMN_DEFAULT AS columnDefault,
        NULLIF(COLUMN_COMMENT, '') AS columnComment,
        ORDINAL_POSITION AS ordinalPosition
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ${tableName}
      ORDER BY ORDINAL_POSITION ASC
    `;
  }

  private inferTableMetadata(
    table: DatabaseTableRow,
    columns: DatabaseColumnRow[]
  ): InferredTableMetadata {
    const primaryKey =
      columns.find((item) => item.columnKey === 'PRI')?.columnName ?? null;

    return {
      tableName: table.tableName,
      tableComment: table.tableComment,
      moduleName: this.toKebabCase(table.tableName),
      businessName: table.tableComment ?? this.toTitleCase(table.tableName),
      className: this.toClassName(table.tableName),
      primaryKey
    };
  }

  private inferColumnMetadata(column: DatabaseColumnRow): InferredColumnMetadata {
    return {
      columnName: column.columnName,
      propertyName: this.toCamelCase(column.columnName),
      columnComment: column.columnComment,
      tsType: this.inferTsType(column),
      formType: this.inferFormType(column),
      queryType: this.inferQueryType(column),
      listVisible: this.inferListVisible(column),
      sort: Number(column.ordinalPosition)
    };
  }

  private async resolveTableMapping(tableName: string): Promise<ResolvedTableMapping> {
    const normalizedTableName = this.normalizeTableName(tableName);
    const table = await this.loadDatabaseTableOrThrow(normalizedTableName);
    const columns = await this.loadTableColumns(normalizedTableName);
    const stored = await this.prisma.codegenTable.findUnique({
      where: {
        tableName: normalizedTableName
      },
      include: {
        columns: {
          orderBy: [{ sort: 'asc' }, { columnName: 'asc' }]
        }
      }
    });

    if (!stored) {
      const inferredTable = this.inferTableMetadata(table, columns);
      const inferredColumns = columns.map((item) => this.inferColumnMetadata(item));

      return this.buildTableMappingResponse(
        table,
        columns,
        {
          ...inferredTable,
          source: 'INFERRED'
        },
        inferredColumns
      );
    }

    const storedColumnMap = new Map(
      stored.columns.map((item) => [item.columnName, item])
    );
    const mergedColumns = columns.map((item) => {
      const inferred = this.inferColumnMetadata(item);
      const metadata = storedColumnMap.get(item.columnName);

      return {
        columnName: item.columnName,
        propertyName: metadata?.propertyName ?? inferred.propertyName,
        columnComment: metadata?.columnComment ?? inferred.columnComment,
        tsType: metadata?.tsType ?? inferred.tsType,
        formType: metadata?.formType ?? inferred.formType,
        queryType: metadata?.queryType ?? inferred.queryType,
        listVisible: metadata?.listVisible ?? inferred.listVisible,
        sort: metadata?.sort ?? inferred.sort
      };
    });

    return this.buildTableMappingResponse(
      table,
      columns,
      {
        tableName: stored.tableName,
        tableComment: stored.tableComment ?? table.tableComment,
        moduleName: stored.moduleName,
        businessName: stored.businessName,
        className: stored.className,
        primaryKey: stored.primaryKey,
        source: 'SYNCED'
      },
      mergedColumns
    );
  }

  private buildTableMappingResponse(
    table: DatabaseTableRow,
    columns: DatabaseColumnRow[],
    tableMetadata: InferredTableMetadata & {
      source: 'INFERRED' | 'SYNCED';
    },
    columnMetadata: InferredColumnMetadata[]
  ) {
    const metadataByName = new Map(
      columnMetadata.map((item) => [item.columnName, item])
    );

    return {
      tableName: table.tableName,
      tableComment: tableMetadata.tableComment ?? table.tableComment,
      moduleName: tableMetadata.moduleName,
      businessName: tableMetadata.businessName,
      className: tableMetadata.className,
      primaryKey: tableMetadata.primaryKey,
      source: tableMetadata.source,
      columns: columns.map((item) => {
        const metadata = metadataByName.get(item.columnName)!;
        return {
          columnName: item.columnName,
          propertyName: metadata.propertyName,
          columnComment: metadata.columnComment,
          dataType: item.dataType,
          columnType: item.columnType,
          nullable: item.isNullable === 'YES',
          primaryKey: item.columnKey === 'PRI',
          hasDefault:
            item.columnDefault !== null ||
            (item.extra ?? '').toLowerCase().includes('auto_increment'),
          autoIncrement: (item.extra ?? '').toLowerCase().includes('auto_increment'),
          tsType: metadata.tsType,
          formType: metadata.formType,
          queryType: metadata.queryType,
          listVisible: metadata.listVisible,
          sort: metadata.sort
        };
      })
    };
  }

  private buildDtoTemplate(mapping: ResolvedTableMapping) {
    const className = mapping.className ?? this.toPascalCase(mapping.moduleName);
    const createFields = mapping.columns
      .filter((item) => !item.primaryKey && item.formType !== 'hidden')
      .map((item) => this.buildDtoField(item, false))
      .filter(Boolean)
      .join('\n\n');
    const updateFields = mapping.columns
      .filter((item) => !item.primaryKey && item.formType !== 'hidden')
      .map((item) => this.buildDtoField(item, true))
      .filter(Boolean)
      .join('\n\n');
    const queryFields = mapping.columns
      .filter((item) => item.queryType !== 'none')
      .map((item) => this.buildQueryField(item))
      .filter(Boolean)
      .join('\n\n');

    return `import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class ${className}ListQueryDto {
${queryFields || "  @ApiPropertyOptional({ description: 'reserved query field' })\n  @IsOptional()\n  @IsString()\n  keyword?: string;"}
}

export class Create${className}Dto {
${createFields || "  @ApiProperty({ description: 'reserved create field' })\n  @IsString()\n  placeholder!: string;"}
}

export class Update${className}Dto {
${updateFields || "  @ApiPropertyOptional({ description: 'reserved update field' })\n  @IsOptional()\n  @IsString()\n  placeholder?: string;"}
}`;
  }

  private buildServiceTemplate(mapping: ResolvedTableMapping) {
    const className = mapping.className ?? this.toPascalCase(mapping.moduleName);
    const serviceClassName = `${className}sService`;
    const dtoFileName = `${this.toFileBaseName(mapping.moduleName)}.dto`;
    const entityAlias = this.lowercaseFirst(className);
    const primaryKey = mapping.primaryKey ?? 'id';
    const primaryKeyType =
      mapping.columns.find((item) => item.columnName === primaryKey)?.tsType ?? 'string';

    return `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import {
  ${className}ListQueryDto,
  Create${className}Dto,
  Update${className}Dto
} from './${dtoFileName}';

@Injectable()
export class ${serviceClassName} {
  constructor(private readonly prisma: PrismaService) {}

  async list(_query: ${className}ListQueryDto) {
    return successResponse({
      total: 0,
      current: 1,
      size: 10,
      records: []
    });
  }

  async detail(${entityAlias}${this.toPascalCase(primaryKey)}: ${primaryKeyType}) {
    return successResponse({
      ${primaryKey}: ${entityAlias}${this.toPascalCase(primaryKey)}
    });
  }

  async create(dto: Create${className}Dto) {
    return successResponse(dto);
  }

  async update(${entityAlias}${this.toPascalCase(primaryKey)}: ${primaryKeyType}, dto: Update${className}Dto) {
    return successResponse({
      ${primaryKey}: ${entityAlias}${this.toPascalCase(primaryKey)},
      ...dto
    });
  }
}`;
  }

  private buildControllerTemplate(mapping: ResolvedTableMapping) {
    const className = mapping.className ?? this.toPascalCase(mapping.moduleName);
    const fileBaseName = this.toFileBaseName(mapping.moduleName);
    const controllerClassName = `${className}sController`;
    const serviceClassName = `${className}sService`;
    const primaryKey = mapping.primaryKey ?? 'id';
    const primaryKeyType =
      mapping.columns.find((item) => item.columnName === primaryKey)?.tsType ?? 'string';
    const paramDecorator = primaryKeyType === 'number' ? "ParseIntPipe, " : '';

    return `import { Body, Controller, Get, Param, Patch, Post, Query, ${paramDecorator}UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/auth/jwt-auth.guard';
import {
  ${className}ListQueryDto,
  Create${className}Dto,
  Update${className}Dto
} from './${fileBaseName}.dto';
import { ${serviceClassName} } from './${fileBaseName}.service';

@ApiTags('${this.escapeSingleQuote(mapping.businessName ?? className)}')
@UseGuards(JwtAuthGuard)
@Controller('${mapping.moduleName}')
export class ${controllerClassName} {
  constructor(private readonly ${this.lowercaseFirst(serviceClassName)}: ${serviceClassName}) {}

  @ApiOperation({ summary: 'List ${this.escapeSingleQuote(mapping.businessName ?? className)}' })
  @Get()
  list(@Query() query: ${className}ListQueryDto) {
    return this.${this.lowercaseFirst(serviceClassName)}.list(query);
  }

  @ApiOperation({ summary: 'Get ${this.escapeSingleQuote(mapping.businessName ?? className)} detail' })
  @Get(':${primaryKey}')
  detail(@Param('${primaryKey}'${primaryKeyType === 'number' ? ', ParseIntPipe' : ''}) ${primaryKey}: ${primaryKeyType}) {
    return this.${this.lowercaseFirst(serviceClassName)}.detail(${primaryKey});
  }

  @ApiOperation({ summary: 'Create ${this.escapeSingleQuote(mapping.businessName ?? className)}' })
  @Post()
  create(@Body() dto: Create${className}Dto) {
    return this.${this.lowercaseFirst(serviceClassName)}.create(dto);
  }

  @ApiOperation({ summary: 'Update ${this.escapeSingleQuote(mapping.businessName ?? className)}' })
  @Patch(':${primaryKey}')
  update(
    @Param('${primaryKey}'${primaryKeyType === 'number' ? ', ParseIntPipe' : ''}) ${primaryKey}: ${primaryKeyType},
    @Body() dto: Update${className}Dto
  ) {
    return this.${this.lowercaseFirst(serviceClassName)}.update(${primaryKey}, dto);
  }
}`;
  }

  private buildModuleTemplate(mapping: ResolvedTableMapping) {
    const className = mapping.className ?? this.toPascalCase(mapping.moduleName);
    const fileBaseName = this.toFileBaseName(mapping.moduleName);

    return `import { Module } from '@nestjs/common';
import { ${className}sController } from './${fileBaseName}.controller';
import { ${className}sService } from './${fileBaseName}.service';

@Module({
  controllers: [${className}sController],
  providers: [${className}sService]
})
export class ${className}sModule {}`;
  }

  private buildDtoField(column: ResolvedMappingColumn, optional: boolean) {
    const validator = this.getValidatorDecorator(column.tsType);
    const swaggerDecorator = optional ? 'ApiPropertyOptional' : 'ApiProperty';
    const optionalDecorator = optional ? '  @IsOptional()\n' : '';
    const propertySignature = optional
      ? `${column.propertyName}?: ${column.tsType};`
      : `${column.propertyName}!: ${column.tsType};`;
    const example = this.getSwaggerExample(column);

    return `  @${swaggerDecorator}({
    description: '${this.escapeSingleQuote(column.columnComment ?? column.columnName)}',
    example: ${example}
  })
${optionalDecorator}  @${validator}
  ${propertySignature}`;
  }

  private buildQueryField(column: ResolvedMappingColumn) {
    const validator = this.getValidatorDecorator(column.tsType);
    const example = this.getSwaggerExample(column);

    return `  @ApiPropertyOptional({
    description: '${this.escapeSingleQuote(column.columnComment ?? column.columnName)} (${column.queryType})',
    example: ${example}
  })
  @IsOptional()
  @${validator}
  ${column.propertyName}?: ${column.tsType};`;
  }

  private toFrontendField(column: ResolvedMappingColumn, includeRequired: boolean) {
    return {
      columnName: column.columnName,
      field: column.propertyName,
      label: column.columnComment ?? this.toTitleCase(column.columnName),
      component: this.toFrontendComponent(column.formType),
      valueType: column.tsType,
      required: includeRequired ? !column.nullable && !column.hasDefault : false
    };
  }

  private toFrontendComponent(formType: string) {
    const componentMap: Record<string, string> = {
      switch: 'switch',
      select: 'select',
      datetime: 'date-picker',
      textarea: 'textarea',
      json: 'code-editor',
      input: 'input',
      hidden: 'hidden'
    };

    return componentMap[formType] ?? 'input';
  }

  private getValidatorDecorator(tsType: string) {
    if (tsType === 'boolean') {
      return 'IsBoolean()';
    }

    if (tsType === 'number') {
      return 'IsNumber()';
    }

    return 'IsString()';
  }

  private getSwaggerExample(column: ResolvedMappingColumn) {
    if (column.tsType === 'boolean') {
      return 'true';
    }

    if (column.tsType === 'number') {
      return '1';
    }

    return `'${this.escapeSingleQuote(column.columnComment ?? column.propertyName)}'`;
  }

  private inferTsType(column: DatabaseColumnRow) {
    const dataType = column.dataType.toLowerCase();
    const columnType = column.columnType.toLowerCase();

    if (dataType === 'tinyint' && columnType.startsWith('tinyint(1)')) {
      return 'boolean';
    }

    if (['boolean', 'bit'].includes(dataType)) {
      return 'boolean';
    }

    if (
      ['int', 'bigint', 'smallint', 'mediumint', 'float', 'double', 'decimal']
        .includes(dataType)
    ) {
      return 'number';
    }

    if (dataType === 'json') {
      return 'Record<string, unknown>';
    }

    return 'string';
  }

  private inferFormType(column: DatabaseColumnRow) {
    if (this.isAuditColumn(column) || column.columnKey === 'PRI') {
      return 'hidden';
    }

    const dataType = column.dataType.toLowerCase();
    const propertyName = this.toCamelCase(column.columnName);

    if (this.inferTsType(column) === 'boolean') {
      return 'switch';
    }

    if (dataType === 'json') {
      return 'json';
    }

    if (['text', 'longtext', 'mediumtext'].includes(dataType)) {
      return 'textarea';
    }

    if (['date', 'datetime', 'timestamp', 'time'].includes(dataType)) {
      return 'datetime';
    }

    if (dataType === 'enum' || propertyName.endsWith('Id')) {
      return 'select';
    }

    return 'input';
  }

  private inferQueryType(column: DatabaseColumnRow) {
    if (this.isAuditColumn(column)) {
      return 'between';
    }

    const propertyName = this.toCamelCase(column.columnName);

    if (
      ['name', 'title', 'username', 'nickname', 'phone', 'email', 'content', 'remark', 'path']
        .includes(propertyName)
    ) {
      return 'like';
    }

    if (
      [
        'id',
        'status',
        'type',
        'category',
        'code',
        'menuKey',
        'permissionCode',
        'tenantId',
        'userId',
        'roleId',
        'departmentId',
        'moduleName'
      ].includes(propertyName) ||
      propertyName.endsWith('Id')
    ) {
      return 'eq';
    }

    if (propertyName.endsWith('At') || propertyName.endsWith('Time')) {
      return 'between';
    }

    return 'none';
  }

  private inferListVisible(column: DatabaseColumnRow) {
    const hiddenNames = new Set([
      'password',
      'meta',
      'detail',
      'event_payload',
      'target_department_ids',
      'target_role_codes'
    ]);

    if (hiddenNames.has(column.columnName)) {
      return false;
    }

    const dataType = column.dataType.toLowerCase();

    if (['json', 'blob', 'longblob', 'mediumblob'].includes(dataType)) {
      return false;
    }

    return true;
  }

  private isAuditColumn(column: DatabaseColumnRow) {
    return [
      'createdAt',
      'updatedAt',
      'deletedAt',
      'lastLoginAt',
      'publishedAt',
      'scheduledPublishAt',
      'visitedAt',
      'assignedAt',
      'expiresAt'
    ].includes(this.toCamelCase(column.columnName));
  }

  private normalizeTableName(tableName: string) {
    return tableName.trim();
  }

  private toCamelCase(value: string) {
    return value.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
  }

  private toKebabCase(value: string) {
    return value.replace(/_/g, '-');
  }

  private toTitleCase(value: string) {
    return value
      .split('_')
      .filter(Boolean)
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      .join(' ');
  }

  private toPascalCase(value: string) {
    return value
      .split(/[_-]/)
      .filter(Boolean)
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      .join('');
  }

  private toFileBaseName(moduleName: string) {
    const segments = moduleName.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? moduleName;
  }

  private lowercaseFirst(value: string) {
    if (!value) {
      return value;
    }

    return value.charAt(0).toLowerCase() + value.slice(1);
  }

  private escapeSingleQuote(value: string) {
    return value.replace(/'/g, "\\'");
  }

  private toClassName(tableName: string) {
    const segments = tableName.split('_').filter(Boolean);
    if (segments.length === 0) {
      return null;
    }

    const lastIndex = segments.length - 1;
    const normalizedLast = this.singularize(segments[lastIndex]);
    return this.toPascalCase(
      [...segments.slice(0, lastIndex), normalizedLast].join('_')
    );
  }

  private singularize(value: string) {
    if (value.endsWith('ies') && value.length > 3) {
      return `${value.slice(0, -3)}y`;
    }

    if (
      value.endsWith('s') &&
      value.length > 1 &&
      !value.endsWith('ss') &&
      !value.endsWith('us') &&
      !value.endsWith('is')
    ) {
      return value.slice(0, -1);
    }

    return value;
  }
}
