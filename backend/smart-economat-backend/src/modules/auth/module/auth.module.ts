import type { StringValue } from 'ms';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from '../service/auth.service';
import { AuthorizationService } from '../service/authorization.service';
import { MailService } from '../mail.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { AuthController } from '../controller/auth.controller';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/role.guard';
import { PermisosGuard } from '../guards/auth-permissions.guard';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { PlantillaRol } from '../../plantillas-roles/plantilla-rol.entity/plantilla-rol.entity';
import { PermisosModule } from '../../permisos/permisos.module';

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
    PermisosModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthorizationService,
    MailService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    PermisosGuard,
  ],
  exports: [
    PassportModule,
    JwtModule,
    JwtAuthGuard,
    RolesGuard,
    AuthorizationService,
    PermisosGuard,
  ],
})
export class AuthModule {}
