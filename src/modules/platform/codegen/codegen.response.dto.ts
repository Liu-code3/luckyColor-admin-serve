import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CodegenTableSummaryResponseDto {
  @ApiProperty({
    description: '数据库表名',
    example: 'users'
  })
  tableName!: string;

  @ApiPropertyOptional({
    description: '数据库表注释',
    nullable: true,
    example: '系统用户'
  })
  tableComment?: string | null;

  @ApiProperty({
    description: '代码生成模块名',
    example: 'users'
  })
  moduleName!: string;

  @ApiPropertyOptional({
    description: '生成的类名',
    nullable: true,
    example: 'User'
  })
  className?: string | null;

  @ApiPropertyOptional({
    description: '主键字段名',
    nullable: true,
    example: 'id'
  })
  primaryKey?: string | null;

  @ApiProperty({
    description: '字段数量',
    example: 12
  })
  columnCount!: number;

  @ApiProperty({
    description: '是否已同步代码生成元数据',
    example: true
  })
  synced!: boolean;
}

export class CodegenTableListResponseDto {
  @ApiProperty({
    description: '可用于代码生成的数据表',
    type: [CodegenTableSummaryResponseDto]
  })
  records!: CodegenTableSummaryResponseDto[];
}

export class CodegenColumnMappingResponseDto {
  @ApiProperty({
    description: '数据库字段名',
    example: 'username'
  })
  columnName!: string;

  @ApiProperty({
    description: '生成的属性名',
    example: 'username'
  })
  propertyName!: string;

  @ApiPropertyOptional({
    description: '字段注释',
    nullable: true,
    example: '用户名'
  })
  columnComment?: string | null;

  @ApiProperty({
    description: '数据库数据类型',
    example: 'varchar'
  })
  dataType!: string;

  @ApiProperty({
    description: '数据库字段类型',
    example: 'varchar(191)'
  })
  columnType!: string;

  @ApiProperty({
    description: '是否允许为空',
    example: false
  })
  nullable!: boolean;

  @ApiProperty({
    description: '是否主键',
    example: false
  })
  primaryKey!: boolean;

  @ApiProperty({
    description: '是否存在默认值或生成值',
    example: false
  })
  hasDefault!: boolean;

  @ApiProperty({
    description: '是否自增',
    example: false
  })
  autoIncrement!: boolean;

  @ApiProperty({
    description: '生成后的字段类型',
    example: 'string'
  })
  tsType!: string;

  @ApiProperty({
    description: '生成的表单组件类型',
    example: 'input'
  })
  formType!: string;

  @ApiProperty({
    description: '生成的查询类型',
    example: 'like'
  })
  queryType!: string;

  @ApiProperty({
    description: '是否在列表中展示',
    example: true
  })
  listVisible!: boolean;

  @ApiProperty({
    description: '字段排序',
    example: 2
  })
  sort!: number;
}

export class CodegenTableMappingResponseDto {
  @ApiProperty({
    description: '数据库表名',
    example: 'users'
  })
  tableName!: string;

  @ApiPropertyOptional({
    description: '数据库表注释',
    nullable: true,
    example: '系统用户'
  })
  tableComment?: string | null;

  @ApiProperty({
    description: '生成文件的模块名',
    example: 'users'
  })
  moduleName!: string;

  @ApiPropertyOptional({
    description: '模板使用的业务名称',
    nullable: true,
    example: '系统用户'
  })
  businessName?: string | null;

  @ApiPropertyOptional({
    description: '生成的类名',
    nullable: true,
    example: 'User'
  })
  className?: string | null;

  @ApiPropertyOptional({
    description: '主键字段名',
    nullable: true,
    example: 'id'
  })
  primaryKey?: string | null;

  @ApiProperty({
    description: '元数据来源，可能来自数据库推断或代码生成元数据表',
    example: 'SYNCED'
  })
  source!: string;

  @ApiProperty({
    description: '字段映射记录',
    type: [CodegenColumnMappingResponseDto]
  })
  columns!: CodegenColumnMappingResponseDto[];
}

export class CodegenTemplateFileResponseDto {
  @ApiProperty({
    description: '生成文件类型',
    example: 'controller'
  })
  type!: string;

  @ApiProperty({
    description: '生成文件相对路径',
    example: 'src/modules/system/users/users.controller.ts'
  })
  path!: string;

  @ApiProperty({
    description: '生成文件内容',
    example: "export class UsersController {}"
  })
  content!: string;
}

export class CodegenBackendTemplatesResponseDto {
  @ApiProperty({
    description: '数据库表名',
    example: 'users'
  })
  tableName!: string;

  @ApiProperty({
    description: '生成文件的模块名',
    example: 'users'
  })
  moduleName!: string;

  @ApiPropertyOptional({
    description: '生成的类名',
    nullable: true,
    example: 'User'
  })
  className?: string | null;

  @ApiProperty({
    description: '生成后的后端模板文件',
    type: [CodegenTemplateFileResponseDto]
  })
  files!: CodegenTemplateFileResponseDto[];
}

export class CodegenFrontendFieldResponseDto {
  @ApiProperty({
    description: '数据库字段名',
    example: 'username'
  })
  columnName!: string;

  @ApiProperty({
    description: '前端字段键名',
    example: 'username'
  })
  field!: string;

  @ApiProperty({
    description: '前端字段标题',
    example: '用户名'
  })
  label!: string;

  @ApiProperty({
    description: '前端组件类型',
    example: 'input'
  })
  component!: string;

  @ApiProperty({
    description: '前端值类型',
    example: 'string'
  })
  valueType!: string;

  @ApiProperty({
    description: '是否必填',
    example: true
  })
  required!: boolean;
}

export class CodegenFrontendSearchFieldResponseDto {
  @ApiProperty({
    description: '数据库字段名',
    example: 'username'
  })
  columnName!: string;

  @ApiProperty({
    description: '前端字段键名',
    example: 'username'
  })
  field!: string;

  @ApiProperty({
    description: '前端字段标题',
    example: '用户名'
  })
  label!: string;

  @ApiProperty({
    description: '查询操作符',
    example: 'like'
  })
  queryType!: string;

  @ApiProperty({
    description: '前端组件类型',
    example: 'input'
  })
  component!: string;
}

export class CodegenFrontendMetaResponseDto {
  @ApiProperty({
    description: '数据库表名',
    example: 'users'
  })
  tableName!: string;

  @ApiProperty({
    description: '生成页面的模块名',
    example: 'users'
  })
  moduleName!: string;

  @ApiPropertyOptional({
    description: '生成页面标题',
    nullable: true,
    example: '系统用户'
  })
  pageTitle?: string | null;

  @ApiProperty({
    description: '建议使用的接口基础路径',
    example: '/api/users'
  })
  apiBasePath!: string;

  @ApiProperty({
    description: '前端表格列配置',
    type: [CodegenFrontendFieldResponseDto]
  })
  tableColumns!: CodegenFrontendFieldResponseDto[];

  @ApiProperty({
    description: '前端查询表单字段',
    type: [CodegenFrontendSearchFieldResponseDto]
  })
  searchFields!: CodegenFrontendSearchFieldResponseDto[];

  @ApiProperty({
    description: '前端新增或编辑表单字段',
    type: [CodegenFrontendFieldResponseDto]
  })
  formFields!: CodegenFrontendFieldResponseDto[];
}
