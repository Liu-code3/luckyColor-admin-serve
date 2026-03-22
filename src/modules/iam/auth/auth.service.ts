import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import {
  errorResponse,
  successResponse
} from '../../../shared/api/api-response';
import { LoginDto } from './auth.dto';
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
      return errorResponse('登录失败');
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
      '登录成功'
    );
  }

  async getProfile(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub
      }
    });

    if (!user) {
      throw new UnauthorizedException('用户登录状态已失效');
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
        username: dto.username
      }
    });

    if (!user || user.password !== dto.password) {
      return null;
    }

    return user;
  }
}
