import type { StringValue } from 'ms';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from '../../auth/service/auth.service';
import { AuthPermissionsService } from '../../auth/service/auth-permissions.service';
import { MailService } from '../../auth/mail.service';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { AuthController } from '../../auth/controller/auth.controller';
import { SherlockJwtAuthGuard } from '../guards/jwt-auth.guard';
import { SherlockRolesGuard } from '../guards/roles.guard';
import { SherlockPermissionsGuard } from '../guards/permissions.guard';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { PlantillaRol } from '../../plantillas-roles/plantilla-rol.entity/plantilla-rol.entity';

/**
 * Global NestJS module that wires together all authentication and authorization
 * infrastructure for the application.
 *
 * Provides and exports:
 * - JWT signing/verification via `@nestjs/jwt` (secret and expiry from config).
 * - Passport strategy (`jwt`) via `@nestjs/passport`.
 * - In-memory cache (TTL 300 s, max 1 000 entries) for permission look-ups.
 * - {@link AuthService}, {@link AuthPermissionsService}, {@link MailService}.
 * - {@link JwtStrategy} — Passport strategy that validates JWT payloads.
 * - {@link SherlockJwtAuthGuard}, {@link SherlockRolesGuard}, {@link SherlockPermissionsGuard}.
 * - {@link AuthController} — exposes login, register, and password-management endpoints.
 *
 * Marked `@Global()` so that its exports are available throughout the application
 * without explicitly importing this module in every feature module.
 *
 * @class SherlockAuthModule
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Permiso, Rol, PlantillaRol]),
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
    CacheModule.register({
      ttl: 300,
      max: 1000,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthPermissionsService,
    MailService,
    JwtStrategy,
    SherlockJwtAuthGuard,
    SherlockRolesGuard,
    SherlockPermissionsGuard,
  ],
  exports: [
    PassportModule,
    JwtModule,
    SherlockJwtAuthGuard,
    SherlockRolesGuard,
    AuthPermissionsService,
    SherlockPermissionsGuard,
    AuthService,
  ],
})
export class SherlockAuthModule {}
