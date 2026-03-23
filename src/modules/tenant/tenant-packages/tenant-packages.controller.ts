import {
  Body,
  Controller,
  Delete,
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
  CreateTenantPackageDto,
  TenantPackageListQueryDto,
  UpdateTenantPackageDto
} from './tenant-packages.dto';
import {
  TenantPackageItemResponseDto,
  TenantPackagePageResponseDto
} from './tenant-packages.response.dto';
import { TenantPackagesService } from './tenant-packages.service';

@ApiTags('租户中心 / 租户套餐')
@ApiServerErrorResponse()
@RequirePermissions('main_system_tenant_package')
@Controller('tenant-packages')
export class TenantPackagesController {
  constructor(private readonly tenantPackagesService: TenantPackagesService) {}

  @ApiOperation({
    summary: '租户套餐分页列表',
    description: '分页查询租户套餐，支持按套餐名称、套餐编码和状态筛选'
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
    example: '基础',
    description: '套餐名称或套餐编码关键字'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: true,
    description: '套餐状态'
  })
  @ApiSuccessResponse({
    type: TenantPackagePageResponseDto,
    description: '租户套餐分页列表',
    dataExample: {
      total: 1,
      current: 1,
      size: 10,
      records: [
        {
          id: 'pkg_basic',
          code: 'basic',
          name: '基础版套餐',
          status: true,
          maxUsers: 50,
          maxRoles: 20,
          maxMenus: 100,
          featureFlags: {
            watermark: true,
            dictionary: true,
            notices: true
          },
          remark: '默认基础租户套餐',
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
  list(@Query() query: TenantPackageListQueryDto) {
    return this.tenantPackagesService.list(query);
  }

  @ApiOperation({
    summary: '创建租户套餐',
    description: '创建租户套餐，用于租户生命周期和能力控制'
  })
  @ApiBody({
    type: CreateTenantPackageDto,
    description: '创建租户套餐请求体',
    examples: {
      default: {
        summary: '创建套餐示例',
        value: {
          code: 'pro',
          name: '专业版套餐',
          status: true,
          maxUsers: 200,
          maxRoles: 50,
          maxMenus: 300,
          featureFlags: {
            watermark: true,
            dictionary: true,
            notices: true,
            analytics: true
          },
          remark: '适用于成长型租户'
        }
      }
    }
  })
  @ApiSuccessResponse({
    type: TenantPackageItemResponseDto,
    description: '创建后的租户套餐信息',
    dataExample: {
      id: 'pkg_pro',
      code: 'pro',
      name: '专业版套餐',
      status: true,
      maxUsers: 200,
      maxRoles: 50,
      maxMenus: 300,
      featureFlags: {
        watermark: true,
        dictionary: true,
        notices: true,
        analytics: true
      },
      remark: '适用于成长型租户',
      createdAt: '2026-03-23T09:30:00.000Z',
      updatedAt: '2026-03-23T09:30:00.000Z'
    }
  })
  @ApiErrorResponse({
    status: 409,
    description: '套餐 ID 或套餐编码已存在',
    examples: [
      {
        name: 'tenantPackageExists',
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
  create(@Body() dto: CreateTenantPackageDto) {
    return this.tenantPackagesService.create(dto);
  }

  @ApiOperation({
    summary: '租户套餐详情',
    description: '根据套餐 ID 查询租户套餐详情'
  })
  @ApiParam({ name: 'id', description: '套餐 ID', example: 'pkg_basic' })
  @ApiSuccessResponse({
    type: TenantPackageItemResponseDto,
    description: '租户套餐详情',
    dataExample: {
      id: 'pkg_basic',
      code: 'basic',
      name: '基础版套餐',
      status: true,
      maxUsers: 50,
      maxRoles: 20,
      maxMenus: 100,
      featureFlags: {
        watermark: true,
        dictionary: true,
        notices: true
      },
      remark: '默认基础租户套餐',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-22T14:30:00.000Z'
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
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.tenantPackagesService.detail(id);
  }

  @ApiOperation({
    summary: '更新租户套餐',
    description: '更新租户套餐状态、容量配置和功能开关'
  })
  @ApiParam({ name: 'id', description: '套餐 ID', example: 'pkg_basic' })
  @ApiBody({
    type: UpdateTenantPackageDto,
    description: '更新租户套餐请求体',
    examples: {
      default: {
        summary: '更新套餐示例',
        value: {
          name: '基础版套餐 Plus',
          status: false,
          maxUsers: 80,
          maxRoles: 30,
          maxMenus: 150,
          featureFlags: {
            watermark: true,
            dictionary: true,
            notices: true
          },
          remark: '暂停销售中的旧套餐'
        }
      }
    }
  })
  @ApiSuccessResponse({
    type: TenantPackageItemResponseDto,
    description: '更新后的租户套餐信息',
    dataExample: {
      id: 'pkg_basic',
      code: 'basic',
      name: '基础版套餐 Plus',
      status: false,
      maxUsers: 80,
      maxRoles: 30,
      maxMenus: 150,
      featureFlags: {
        watermark: true,
        dictionary: true,
        notices: true
      },
      remark: '暂停销售中的旧套餐',
      createdAt: '2026-03-22T14:30:00.000Z',
      updatedAt: '2026-03-23T10:00:00.000Z'
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
    description: '套餐编码已存在',
    examples: [
      {
        name: 'tenantPackageExists',
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
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantPackageDto) {
    return this.tenantPackagesService.update(id, dto);
  }

  @ApiOperation({
    summary: '删除租户套餐',
    description: '删除未被任何租户使用的套餐'
  })
  @ApiParam({ name: 'id', description: '套餐 ID', example: 'pkg_basic' })
  @ApiSuccessResponse({
    description: '租户套餐删除结果',
    dataSchema: {
      type: 'boolean',
      example: true
    },
    dataExample: true
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
    description: '租户套餐已被租户使用，无法删除',
    examples: [
      {
        name: 'tenantPackageInUse',
        code: BUSINESS_ERROR_CODES.TENANT_PACKAGE_IN_USE
      }
    ]
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tenantPackagesService.remove(id);
  }
}
