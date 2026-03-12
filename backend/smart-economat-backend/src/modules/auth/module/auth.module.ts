import type { StringValue } from 'ms';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../service/auth.service';
import { MailService } from '../mail.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { AuthController } from '../controller/auth.controller';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/role.guard';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { AuthorizationModule } from './authorization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_EXPIRATION') as StringValue,
        },
      }),
    }),
    AuthorizationModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [PassportModule, JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
