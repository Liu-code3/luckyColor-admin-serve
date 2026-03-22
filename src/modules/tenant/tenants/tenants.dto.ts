import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min
} from 'class-validator';
import { TENANT_STATUS_VALUES, type TenantStatus } from './tenant.constants';

export class TenantListQueryDto {
  @ApiPropertyOptional({
    description: 'page number',
    example: 1,
    default: 1
  })
  @Type(() => Number)
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: 'page size',
    example: 10,
    default: 10
  })
  @Type(() => Number)
  @Min(1)
  size = 10;

  @ApiPropertyOptional({
    description: 'keyword for tenant name or code',
    example: 'default'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'tenant status',
    enum: TENANT_STATUS_VALUES,
    example: 'ACTIVE'
  })
  @IsOptional()
  @IsIn(TENANT_STATUS_VALUES)
  status?: TenantStatus;
}

export class CreateTenantDto {
  @ApiPropertyOptional({
    description: 'tenant id, auto-generated when omitted',
    example: 'tenant_1001'
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'tenant code',
    example: 'acme'
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    description: 'tenant name',
    example: 'Acme Studio'
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description:
      'tenant package id, default active package will be used when omitted',
    example: 'pkg_basic'
  })
  @IsOptional()
  @IsString()
  packageId?: string;

  @ApiPropertyOptional({
    description: 'tenant status',
    enum: TENANT_STATUS_VALUES,
    example: 'ACTIVE',
    default: 'ACTIVE'
  })
  @IsOptional()
  @IsIn(TENANT_STATUS_VALUES)
  status?: TenantStatus;

  @ApiPropertyOptional({
    description: 'tenant expires at',
    example: '2027-03-22T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'contact name',
    example: 'Alice'
  })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'contact phone',
    example: '13800000003'
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'contact email',
    example: 'alice@acme.local'
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'tenant remark',
    example: 'created by platform admin'
  })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional({
    description: 'admin username',
    example: 'admin',
    default: 'admin'
  })
  @IsOptional()
  @IsString()
  adminUsername?: string;

  @ApiProperty({
    description: 'admin password',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  adminPassword!: string;

  @ApiPropertyOptional({
    description: 'admin nickname',
    example: 'Acme Admin'
  })
  @IsOptional()
  @IsString()
  adminNickname?: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: 'tenant name',
    example: 'Acme Studio Pro'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: 'tenant package id',
    example: 'pkg_pro'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  packageId?: string;

  @ApiPropertyOptional({
    description: 'tenant status',
    enum: TENANT_STATUS_VALUES,
    example: 'FROZEN'
  })
  @IsOptional()
  @IsIn(TENANT_STATUS_VALUES)
  status?: TenantStatus;

  @ApiPropertyOptional({
    description: 'tenant expires at, pass null to clear',
    example: '2027-06-30T00:00:00.000Z',
    nullable: true
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @ApiPropertyOptional({
    description: 'contact name, pass null to clear',
    example: 'Alice',
    nullable: true
  })
  @IsOptional()
  @IsString()
  contactName?: string | null;

  @ApiPropertyOptional({
    description: 'contact phone, pass null to clear',
    example: '13800000003',
    nullable: true
  })
  @IsOptional()
  @IsString()
  contactPhone?: string | null;

  @ApiPropertyOptional({
    description: 'contact email, pass null to clear',
    example: 'alice@acme.local',
    nullable: true
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string | null;

  @ApiPropertyOptional({
    description: 'tenant remark, pass null to clear',
    example: 'renewed by platform admin',
    nullable: true
  })
  @IsOptional()
  @IsString()
  remark?: string | null;
}
