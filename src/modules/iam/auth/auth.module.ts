import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TenantsModule } from '../../tenant/tenants/tenants.module';
import { AppConfigService } from '../../../shared/config/app-config.service';
import { AuthCaptchaService } from './auth-captcha.service';
import { AuthLoginService } from './auth-login.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TenantsModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => {
        return {
          secret: appConfig.jwtSecret,
          signOptions: {
            expiresIn: appConfig.jwtExpiresIn as never
          }
        };
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthCaptchaService, AuthLoginService, AuthService, JwtStrategy],
  exports: [JwtModule]
})
export class AuthModule {}
