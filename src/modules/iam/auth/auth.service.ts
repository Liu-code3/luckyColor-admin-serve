import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../infra/database/prisma/prisma.service';
import { successResponse } from '../../../shared/api/api-response';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';
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
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_LOGIN_FAILED);
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return successResponse({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '2h',
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname
      }
    });
  }

  async getProfile(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub
      }
    });

    if (!user) {
      throw new BusinessException(BUSINESS_ERROR_CODES.AUTH_TOKEN_INVALID);
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
