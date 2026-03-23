import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  ApiErrorResponse,
  ApiServerErrorResponse,
  ApiSuccessResponse
} from '../../../shared/swagger/swagger-response';
import { RequirePermissions } from '../../iam/permissions/require-permissions.decorator';
import {
  CreateTenantDto,
  TenantListQueryDto,
  UpdateTenantDto
} from './tenants.dto';
import {
  TenantInitResultResponseDto,
  TenantItemResponseDto,
  TenantPageResponseDto
} from './tenants.response.dto';
import { TenantsService } from './tenants.service';

@ApiTags('租户中心 / 租户管理')
@ApiServerErrorResponse()
@RequirePermissions('main_system_tenant')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @ApiOperation({
    summary: '租户分页列表',
    description: '分页查询租户列表，支持按租户名称、租户编码和状态筛选'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: '页码'
  })
  @ApiQuery({
    name: 'size',
    required: false,
    example: 10,
    description: '每页条数'
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    example: '默认',
    description: '租户名称或租户编码关键字'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: 'ACTIVE',
    description: '租户状态'
  })
  @ApiSuccessResponse({
    type: TenantPageResponseDto,
    description: '租户分页列表',
    dataExample: {
      total: 1,
      current: 1,
      size: 10,
      records: [
        {
          id: 'tenant_001',
          code: 'default',
          name: '默认租户',
          status: 'ACTIVE',
          expiresAt: '2099-12-31T23:59:59.000Z',
          contactName: '系统管理员',
          contactPhone: '13800000000',
          contactEmail: 'admin@luckycolor.local',
          tenantPackage: {
            id: 'pkg_basic',
            code: 'basic',
            name: '基础版套餐',
            status: true
          },
          remark: '本地初始化默认租户',
          createdAt: '2026-03-22T14:30:00.000Z',
          updatedAt: '2026-03-22T14:30:00.000Z'
        }
      ]
    }
  })
  @ApiErrorResponse({
    status: 422,
    description: '请求参数不合法',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @Get()
  list(@Query() query: TenantListQueryDto) {
    return this.tenantsService.list(query);
  }

  @ApiOperation({
    summary: '创建租户',
    description:
      '创建租户并初始化管理员、默认角色、默认部门、菜单绑定和基础字典数据'
  })
  @ApiBody({
    type: CreateTenantDto,
    description: '创建租户请求体',
    examples: {
      default: {
        summary: '创建租户示例',
        value: {
          code: 'acme',
          name: 'Acme 科技',
          packageId: 'pkg_basic',
          status: 'ACTIVE',
          expiresAt: '2027-03-22T00:00:00.000Z',
          contactName: '张三',
          contactPhone: '13800000003',
          contactEmail: 'zhangsan@acme.local',
          remark: '平台管理员创建',
          adminUsername: 'admin',
          adminPassword: '123456',
          adminNickname: 'Acme 管理员'
        }
      }
    }
  })
  @ApiSuccessResponse({
    type: TenantInitResultResponseDto,
    description: '租户创建结果',
    dataExample: {
      tenant: {
        id: 'tenant_1001',
        code: 'acme',
        name: 'Acme 科技',
        status: 'ACTIVE',
        expiresAt: '2027-03-22T00:00:00.000Z',
        contactName: '张三',
        contactPhone: '13800000003',
        contactEmail: 'zhangsan@acme.local',
        tenantPackage: {
          id: 'pkg_basic',
          code: 'basic',
          name: '基础版套餐',
          status: true
        },
        remark: '平台管理员创建',
        createdAt: '2026-03-22T14:30:00.000Z',
        updatedAt: '2026-03-22T14:30:00.000Z'
      },
      adminUser: {
        id: 'clxuser1234567890',
        username: 'admin',
        nickname: 'Acme 管理员'
      },
      roles: [
        {
          id: 'clxrole1234567890',
          code: 'tenant_admin',
          name: '租户管理员'
        },
        {
          id: 'clxrole1234567891',
          code: 'tenant_member',
          name: '普通成员'
        }
      ],
      departments: [
        {
          id: 201,
          code: 'acme_headquarters',
          name: '总部'
        },
        {
          id: 211,
          code: 'acme_product',
          name: '产品部'
        },
        {
          id: 221,
          code: 'acme_operations',
          name: '运营部'
        }
      ],
      menuIds: [1, 2, 3, 4, 5, 6, 7, 8, 11, 13, 14],
      dictionaryIds: [
        'tenant_1001_notice_scope_root',
        'tenant_1001_notice_scope_all',
        'tenant_1001_notice_scope_department',
        'tenant_1001_notice_scope_role'
      ]
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '租户套餐不存在',
    examples: [
      {
        name: 'tenantPackageNotFound',
        code: BUSINESS_ERROR_CODES.TENANT_PACKAGE_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 409,
    description: '租户编码已存在',
    examples: [
      {
        name: 'tenantCodeExists',
        code: BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS
      }
    ]
  })
  @ApiErrorResponse({
    status: 422,
    description: '请求参数不合法',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @ApiOperation({
    summary: '更新租户',
    description:
      '更新租户基础信息、状态、到期时间或关联套餐，并记录租户审计日志'
  })
  @ApiParam({ name: 'id', description: '租户 ID', example: 'tenant_001' })
  @ApiBody({
    type: UpdateTenantDto,
    description: '更新租户请求体',
    examples: {
      default: {
        summary: '更新租户示例',
        value: {
          name: 'Acme 科技专业版',
          packageId: 'pkg_pro',
          status: 'FROZEN',
          expiresAt: '2027-06-30T00:00:00.000Z',
          contactName: '李四',
          contactPhone: '13900000000',
          contactEmail: 'lisi@acme.local',
          remark: '续费并升级套餐'
        }
      }
    }
  })
  @ApiSuccessResponse({
    type: TenantItemResponseDto,
    description: '更新后的租户信息',
    dataExample: {
      id: 'tenant_001',
      code: 'default',
      name: 'Acme 科技专业版',
      status: 'FROZEN',
      expiresAt: '2027-06-30T00:00:00.000Z',
      contactName: '李四',
      contactPhone: '13900000000',
      contactEmail: 'lisi@acme.local',
      tenantPackage: {
        id: 'pkg_pro',
        code: 'pro',
        name: '专业版套餐',
        status: true
      },
      remark: '续费并升级套餐',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-23T09:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 400,
    description: '租户套餐状态不允许被绑定',
    examples: [
      {
        name: 'statusNotAllowed',
        code: BUSINESS_ERROR_CODES.STATUS_NOT_ALLOWED
      }
    ]
  })
  @ApiErrorResponse({
    status: 404,
    description: '租户或租户套餐不存在',
    examples: [
      {
        name: 'tenantNotFound',
        code: BUSINESS_ERROR_CODES.TENANT_NOT_FOUND
      },
      {
        name: 'tenantPackageNotFound',
        code: BUSINESS_ERROR_CODES.TENANT_PACKAGE_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 422,
    description: '请求参数不合法',
    examples: [
      {
        name: 'invalidParams',
        code: BUSINESS_ERROR_CODES.REQUEST_PARAMS_INVALID
      }
    ]
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @ApiOperation({
    summary: '租户详情',
    description: '根据租户 ID 查询租户详情'
  })
  @ApiParam({ name: 'id', description: '租户 ID', example: 'tenant_001' })
  @ApiSuccessResponse({
    type: TenantItemResponseDto,
    description: '租户详情',
    dataExample: {
      id: 'tenant_001',
      code: 'default',
      name: '默认租户',
      status: 'ACTIVE',
      expiresAt: '2099-12-31T23:59:59.000Z',
      contactName: '系统管理员',
      contactPhone: '13800000000',
      contactEmail: 'admin@luckycolor.local',
      tenantPackage: {
        id: 'pkg_basic',
        code: 'basic',
        name: '基础版套餐',
        status: true
      },
      remark: '本地初始化默认租户',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: '租户不存在',
    examples: [
      {
        name: 'tenantNotFound',
        code: BUSINESS_ERROR_CODES.TENANT_NOT_FOUND
      }
    ]
  })
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.tenantsService.detail(id);
  }
}
