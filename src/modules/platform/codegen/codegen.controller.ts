import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  ApiErrorResponse,
  ApiForbiddenErrorResponse,
  ApiServerErrorResponse,
  ApiSuccessResponse,
  ApiUnauthorizedErrorResponse
} from '../../../shared/swagger/swagger-response';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import { JwtAuthGuard } from '../../iam/auth/jwt-auth.guard';
import { CodegenTableListQueryDto } from './codegen.dto';
import {
  CodegenBackendTemplatesResponseDto,
  CodegenFrontendMetaResponseDto,
  CodegenTableListResponseDto,
  CodegenTableMappingResponseDto
} from './codegen.response.dto';
import { CodegenService } from './codegen.service';

@ApiTags('平台能力 / 代码生成器')
@ApiServerErrorResponse()
@ApiUnauthorizedErrorResponse()
@ApiForbiddenErrorResponse({
  description: '当前登录态无权访问目标租户上下文',
  examples: [
    {
      name: 'tenantDisabled',
      code: BUSINESS_ERROR_CODES.TENANT_DISABLED
    },
    {
      name: 'tenantExpired',
      code: BUSINESS_ERROR_CODES.TENANT_EXPIRED
    },
    {
      name: 'tenantFrozen',
      code: BUSINESS_ERROR_CODES.TENANT_FROZEN
    },
    {
      name: 'tenantAccessDenied',
      code: BUSINESS_ERROR_CODES.TENANT_ACCESS_DENIED
    }
  ]
})
@UseGuards(JwtAuthGuard)
@Controller('codegen')
export class CodegenController {
  constructor(private readonly codegenService: CodegenService) {}

  @ApiOperation({
    summary: '读取可生成代码的数据表',
    description:
      '读取当前 MySQL 基础表，并合并已有代码生成元数据摘要，供后续模板生成使用。'
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    example: '用户',
    description: '表名或表注释关键字'
  })
  @ApiSuccessResponse({
    type: CodegenTableListResponseDto,
    description: '可用于代码生成的数据表列表',
    dataExample: {
      records: [
        {
          tableName: 'users',
          tableComment: '系统用户',
          moduleName: 'users',
          className: 'User',
          primaryKey: 'id',
          columnCount: 12,
          synced: true
        }
      ]
    }
  })
  @Get('tables')
  listTables(@Query() query: CodegenTableListQueryDto): Promise<unknown> {
    return this.codegenService.listTables(query);
  }

  @ApiOperation({
    summary: '读取代码生成字段映射',
    description:
      '加载数据库字段结构，并将已保存的代码生成元数据合并为字段映射结果。'
  })
  @ApiParam({
    name: 'tableName',
    description: '数据库表名',
    example: 'users'
  })
  @ApiSuccessResponse({
    type: CodegenTableMappingResponseDto,
    description: '代码生成字段映射详情',
    dataExample: {
      tableName: 'users',
      tableComment: '系统用户',
      moduleName: 'users',
      businessName: '系统用户',
      className: 'User',
      primaryKey: 'id',
      source: 'SYNCED',
      columns: [
        {
          columnName: 'username',
          propertyName: 'username',
          columnComment: '用户名',
          dataType: 'varchar',
          columnType: 'varchar(191)',
          nullable: false,
          primaryKey: false,
          hasDefault: false,
          autoIncrement: false,
          tsType: 'string',
          formType: 'input',
          queryType: 'like',
          listVisible: true,
          sort: 3
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '当前数据库中不存在该表',
    examples: [
      {
        name: 'codegenTableNotFound',
        code: BUSINESS_ERROR_CODES.CODEGEN_TABLE_NOT_FOUND
      }
    ]
  })
  @Get('tables/:tableName/mapping')
  mapping(@Param('tableName') tableName: string): Promise<unknown> {
    return this.codegenService.mapping(tableName);
  }

  @ApiOperation({
    summary: '同步代码生成元数据',
    description:
      '根据当前数据库表结构推断并持久化表、字段元数据，供后续模板生成使用。'
  })
  @ApiParam({
    name: 'tableName',
    description: '数据库表名',
    example: 'users'
  })
  @ApiSuccessResponse({
    type: CodegenTableMappingResponseDto,
    description: '同步后的代码生成字段映射详情',
    dataExample: {
      tableName: 'users',
      tableComment: '系统用户',
      moduleName: 'users',
      businessName: '系统用户',
      className: 'User',
      primaryKey: 'id',
      source: 'SYNCED',
      columns: [
        {
          columnName: 'status',
          propertyName: 'status',
          columnComment: '用户状态',
          dataType: 'tinyint',
          columnType: 'tinyint(1)',
          nullable: false,
          primaryKey: false,
          hasDefault: true,
          autoIncrement: false,
          tsType: 'boolean',
          formType: 'switch',
          queryType: 'eq',
          listVisible: true,
          sort: 8
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '当前数据库中不存在该表',
    examples: [
      {
        name: 'codegenTableNotFound',
        code: BUSINESS_ERROR_CODES.CODEGEN_TABLE_NOT_FOUND
      }
    ]
  })
  @Post('tables/:tableName/sync')
  syncTable(@Param('tableName') tableName: string): Promise<unknown> {
    return this.codegenService.syncTable(tableName);
  }

  @ApiOperation({
    summary: '生成后端模板内容',
    description:
      '基于当前字段映射生成 NestJS 后端控制器、服务、DTO 和模块模板内容。'
  })
  @ApiParam({
    name: 'tableName',
    description: '数据库表名',
    example: 'users'
  })
  @ApiSuccessResponse({
    type: CodegenBackendTemplatesResponseDto,
    description: '生成后的后端模板文件',
    dataExample: {
      tableName: 'users',
      moduleName: 'users',
      className: 'User',
      files: [
        {
          type: 'controller',
          path: 'src/modules/users/users.controller.ts',
          content: "export class UsersController {}"
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '当前数据库中不存在该表',
    examples: [
      {
        name: 'codegenTableNotFound',
        code: BUSINESS_ERROR_CODES.CODEGEN_TABLE_NOT_FOUND
      }
    ]
  })
  @Get('tables/:tableName/backend-templates')
  backendTemplates(@Param('tableName') tableName: string): Promise<unknown> {
    return this.codegenService.backendTemplates(tableName);
  }

  @ApiOperation({
    summary: '读取前端模板元数据',
    description:
      '输出前端列表、查询和表单元数据，供后续管理端代码生成使用。'
  })
  @ApiParam({
    name: 'tableName',
    description: '数据库表名',
    example: 'users'
  })
  @ApiSuccessResponse({
    type: CodegenFrontendMetaResponseDto,
    description: '前端模板元数据',
    dataExample: {
      tableName: 'users',
      moduleName: 'users',
      pageTitle: '系统用户',
      apiBasePath: '/api/users',
      tableColumns: [
        {
          columnName: 'username',
          field: 'username',
          label: '用户名',
          component: 'input',
          valueType: 'string',
          required: false
        }
      ],
      searchFields: [
        {
          columnName: 'username',
          field: 'username',
          label: '用户名',
          queryType: 'like',
          component: 'input'
        }
      ],
      formFields: [
        {
          columnName: 'username',
          field: 'username',
          label: '用户名',
          component: 'input',
          valueType: 'string',
          required: true
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '当前数据库中不存在该表',
    examples: [
      {
        name: 'codegenTableNotFound',
        code: BUSINESS_ERROR_CODES.CODEGEN_TABLE_NOT_FOUND
      }
    ]
  })
  @Get('tables/:tableName/frontend-meta')
  frontendMeta(@Param('tableName') tableName: string): Promise<unknown> {
    return this.codegenService.frontendMeta(tableName);
  }
}
