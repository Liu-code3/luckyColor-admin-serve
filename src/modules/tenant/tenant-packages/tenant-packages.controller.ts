import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
import {
  ApiErrorResponse,
  ApiServerErrorResponse,
  ApiSuccessResponse
} from '../../../shared/swagger/swagger-response';
import { TenantPackageListQueryDto } from './tenant-packages.dto';
import {
  TenantPackageItemResponseDto,
  TenantPackagePageResponseDto
} from './tenant-packages.response.dto';
import { TenantPackagesService } from './tenant-packages.service';

@ApiTags('租户中心 / 套餐管理')
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
}
