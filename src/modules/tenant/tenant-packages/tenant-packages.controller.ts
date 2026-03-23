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
@Controller('tenant-packages')
export class TenantPackagesController {
  constructor(private readonly tenantPackagesService: TenantPackagesService) {}

  @ApiOperation({
    summary: 'tenant package page list',
    description: 'query tenant packages by keyword and status'
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
    example: 'basic',
    description: 'keyword for package name or code'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: true,
    description: 'package status'
  })
  @ApiSuccessResponse({
    type: TenantPackagePageResponseDto,
    description: 'tenant package page response',
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
    description: 'invalid params',
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
    summary: 'create tenant package',
    description: 'create a tenant package for tenant lifecycle management'
  })
  @ApiBody({ type: CreateTenantPackageDto })
  @ApiSuccessResponse({
    type: TenantPackageItemResponseDto,
    description: 'tenant package create response',
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
    description: 'package id or code already exists',
    examples: [
      {
        name: 'tenantPackageExists',
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
  create(@Body() dto: CreateTenantPackageDto) {
    return this.tenantPackagesService.create(dto);
  }

  @ApiOperation({
    summary: 'tenant package detail',
    description: 'query tenant package detail by package id'
  })
  @ApiParam({ name: 'id', description: 'package id', example: 'pkg_basic' })
  @ApiSuccessResponse({
    type: TenantPackageItemResponseDto,
    description: 'tenant package detail response',
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
    description: 'tenant package not found',
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
    summary: 'update tenant package',
    description: 'patch tenant package status, quota and feature flags'
  })
  @ApiParam({ name: 'id', description: 'package id', example: 'pkg_basic' })
  @ApiBody({ type: UpdateTenantPackageDto })
  @ApiSuccessResponse({
    type: TenantPackageItemResponseDto,
    description: 'tenant package update response',
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
    description: 'package code already exists',
    examples: [
      {
        name: 'tenantPackageExists',
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
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantPackageDto) {
    return this.tenantPackagesService.update(id, dto);
  }

  @ApiOperation({
    summary: 'delete tenant package',
    description: 'delete tenant package when it is not referenced by any tenant'
  })
  @ApiParam({ name: 'id', description: 'package id', example: 'pkg_basic' })
  @ApiSuccessResponse({
    description: 'tenant package delete result',
    dataSchema: {
      type: 'boolean',
      example: true
    },
    dataExample: true
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
    description: 'tenant package is currently used by tenants',
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
