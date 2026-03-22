import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import {
  errorResponse,
  successResponse
} from '../../../shared/api/api-response';
import { LoginDto, MenuListDto } from './auth.dto';
import type { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);

    if (!user) {
      return errorResponse('鐧诲綍澶辫触');
    }

    return successResponse(user.token, '鐧诲綍鎴愬姛~');
  }

  async jwtLogin(dto: LoginDto) {
    const user = await this.validateUser(dto);

    if (!user) {
      return errorResponse('鐧诲綍澶辫触');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return successResponse(
      {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '2h',
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname
        }
      },
      'JWT鐧诲綍鎴愬姛~'
    );
  }

  async getMenuList(dto: MenuListDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        token: dto.token
      }
    });

    if (!user) {
      return errorResponse('鑾峰彇鑿滃崟澶辫触');
    }

    const menus = await this.prisma.menu.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    });

    return successResponse(
      menus.map((menu) => this.toMenuResponse(menu)),
      '鑾峰彇鑿滃崟鎴愬姛~'
    );
  }

  async getProfile(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub
      }
    });

    if (!user) {
      throw new UnauthorizedException('鐢ㄦ埛鐧诲綍鐘舵€佸凡澶辨晥');
    }

    return successResponse({
      id: user.id,
      username: user.username,
      nickname: user.nickname
    });
  }

  private async validateUser(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.adminName
      }
    });

    if (!user || user.password !== dto.password) {
      return null;
    }

    return user;
  }

  private toMenuResponse(menu: Prisma.MenuGetPayload<Record<string, never>>) {
    return {
      pid: menu.parentId ?? 0,
      id: menu.id,
      title: menu.title,
      name: menu.name,
      type: menu.type,
      path: menu.path,
      key: menu.menuKey,
      icon: menu.icon ?? '',
      layout: menu.layout ?? '',
      isVisible: menu.isVisible,
      component: menu.component,
      redirect: menu.redirect ?? undefined,
      meta: (menu.meta as Record<string, unknown> | null) ?? undefined
    };
  }
}
