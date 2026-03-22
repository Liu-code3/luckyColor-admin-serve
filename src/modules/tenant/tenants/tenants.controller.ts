import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
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
import { CreateTenantDto, TenantListQueryDto, UpdateTenantDto } from './tenants.dto';
import {
  TenantInitResultResponseDto,
  TenantItemResponseDto,
  TenantPageResponseDto
} from './tenants.response.dto';
import { TenantsService } from './tenants.service';

@ApiTags('租户中心 / 租户管理')
@ApiServerErrorResponse()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @ApiOperation({
    summary: 'tenant page list',
    description: 'query tenants by keyword and status'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'page number'
  })
  @ApiQuery({
    name: 'size',
    required: false,
    example: 10,
    description: 'page size'
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    example: 'default',
    description: 'keyword for tenant name or code'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: 'ACTIVE',
    description: 'tenant status'
  })
  @ApiSuccessResponse({
    type: TenantPageResponseDto,
    description: 'tenant page response',
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
    description: 'invalid params',
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
    summary: 'create tenant and initialize defaults',
    description:
      'create tenant, admin user, default roles, departments, menu bindings and basic dictionaries in one transaction'
  })
  @ApiBody({ type: CreateTenantDto })
  @ApiSuccessResponse({
    type: TenantInitResultResponseDto,
    description: 'tenant initialization response',
    dataExample: {
      tenant: {
        id: 'tenant_1001',
        code: 'acme',
        name: 'Acme Studio',
        status: 'ACTIVE',
        expiresAt: '2027-03-22T00:00:00.000Z',
        contactName: 'Alice',
        contactPhone: '13800000003',
        contactEmail: 'alice@acme.local',
        tenantPackage: {
          id: 'pkg_basic',
          code: 'basic',
          name: '基础版套餐',
          status: true
        },
        remark: 'created by platform admin',
        createdAt: '2026-03-22T14:30:00.000Z',
        updatedAt: '2026-03-22T14:30:00.000Z'
      },
      adminUser: {
        id: 'clxuser1234567890',
        username: 'admin',
        nickname: 'Acme Admin'
      },
      roles: [
        {
          id: 'clxrole1234567890',
          code: 'tenant_admin',
          name: 'Tenant Admin'
        },
        {
          id: 'clxrole1234567891',
          code: 'tenant_member',
          name: 'Tenant Member'
        }
      ],
      departments: [
        {
          id: 201,
          code: 'acme_headquarters',
          name: 'Headquarters'
        },
        {
          id: 211,
          code: 'acme_product',
          name: 'Product'
        },
        {
          id: 221,
          code: 'acme_operations',
          name: 'Operations'
        }
      ],
      menuIds: [1, 2, 3, 4, 5, 6, 7, 8, 11],
      dictionaryIds: [
        'tenant_1001_notice_scope_root',
        'tenant_1001_notice_scope_all'
      ]
    }
  })
  @ApiErrorResponse({
    status: 404,
    description: 'tenant package not found',
    examples: [
      {
        name: 'tenantPackageNotFound',
        code: BUSINESS_ERROR_CODES.TENANT_PACKAGE_NOT_FOUND
      }
    ]
  })
  @ApiErrorResponse({
    status: 409,
    description: 'tenant code already exists',
    examples: [
      {
        name: 'tenantCodeExists',
        code: BUSINESS_ERROR_CODES.DATA_ALREADY_EXISTS
      }
    ]
  })
  @ApiErrorResponse({
    status: 422,
    description: 'invalid params',
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
    summary: 'update tenant',
    description:
      'patch tenant base info, status, expiresAt or package and record tenant audit logs'
  })
  @ApiParam({ name: 'id', description: 'tenant id', example: 'tenant_001' })
  @ApiBody({ type: UpdateTenantDto })
  @ApiSuccessResponse({
    type: TenantItemResponseDto,
    description: 'updated tenant response',
    dataExample: {
      id: 'tenant_001',
      code: 'default',
      name: 'Default Tenant Pro',
      status: 'FROZEN',
      expiresAt: '2027-06-30T00:00:00.000Z',
      contactName: 'Alice',
      contactPhone: '13900000000',
      contactEmail: 'alice@default.local',
      tenantPackage: {
        id: 'pkg_pro',
        code: 'pro',
        name: 'Pro',
        status: true
      },
      remark: 'renewed by platform admin',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-23T09:00:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 400,
    description: 'tenant package status is not allowed',
    examples: [
      {
        name: 'statusNotAllowed',
        code: BUSINESS_ERROR_CODES.STATUS_NOT_ALLOWED
      }
    ]
  })
  @ApiErrorResponse({
    status: 404,
    description: 'tenant or tenant package not found',
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
    description: 'invalid params',
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
    summary: 'tenant detail',
    description: 'query tenant detail by tenant id'
  })
  @ApiParam({ name: 'id', description: 'tenant id', example: 'tenant_001' })
  @ApiSuccessResponse({
    type: TenantItemResponseDto,
    description: 'tenant detail response',
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
    description: 'tenant not found',
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
