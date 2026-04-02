import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { SmartAuthThrottlerGuard } from './common/guards/smart-throttler.guard';
import { HighTrafficAlertInterceptor } from './common/interceptors/high-traffic-alert.interceptor';
import { SentryModule } from '@sentry/nestjs/setup';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { typeOrmConfig } from './config/database.config';

import { PlantillasRolesModule } from './modules/plantillas-roles/plantillas-roles.module';
import { IsUniqueConstraint } from './common/decorators/is-unique.decorator';
import { ExportModule } from './modules/export/export.module';
import { MermaModule } from './modules/merma/merma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { UbicacionModule } from './modules/ubicacion/ubicacion.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ProductoModule } from './modules/producto/producto.module';
import { ProveedorModule } from './modules/proveedor/proveedor.module';
import { PedidoModule } from './modules/pedido/pedido.module';
import { RecepcionModule } from './modules/recepcion/recepcion.module';
import { MovimientoModule } from './modules/movimiento/movimiento.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { RecetaModule } from './modules/receta/receta.module';
import { PreparacionModule } from './modules/preparacion/preparacion.module';
import { ArchivoModule } from './modules/archivo/archivo.module';
import { IncidenciaModule } from './modules/incidencia/incidencia.module';
import { AlumnoModule } from './modules/alumno/alumno.module';
import { ProfesorModule } from './modules/profesor/profesor.module';
import { AdminModule } from './modules/admin/admin.module';
import { AlbaranModule } from './modules/albaran/albaran.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PedidoDraftModule } from './modules/pedido-draft/pedido-draft.module';
import { RecepcionDraftModule } from './modules/recepcion-draft/recepcion-draft.module';
import { DistribucionModule } from './modules/distribucion/distribucion.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    CacheModule.register({ isGlobal: true, ttl: 300000, max: 100 }),
    ThrottlerModule.forRoot([
      { name: 'auth', ttl: 60000, limit: 100 },
      { name: 'write', ttl: 60000, limit: 200 },
      { name: 'read', ttl: 60000, limit: 1000 },
    ]),
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (): TypeOrmModuleOptions => {
        if (process.env.NODE_ENV === 'test') {
          return {
            ...typeOrmConfig,
            synchronize: false,
            dropSchema: false,
            logging: false,
            autoLoadEntities: true,
          } as TypeOrmModuleOptions;
        }
        return typeOrmConfig;
      },
      dataSourceFactory: async (options) => {
        if (process.env.NODE_ENV === 'test') {
          const { getTestDataSource } = require('../test/setup/pg-mem') as {
            getTestDataSource: () => Promise<DataSource>;
          };
          const ds = await getTestDataSource();

          ds.destroy = async () => {};

          return ds;
        }
        return new DataSource(options!).initialize();
      },
    }),
    PlantillasRolesModule,
    ExportModule,
    MermaModule,
    UbicacionModule,
    InventarioModule,
    ProductoModule,
    ProveedorModule,
    PedidoModule,
    RecepcionModule,
    MovimientoModule,
    UsuarioModule,
    RecetaModule,
    PreparacionModule,
    ArchivoModule,
    IncidenciaModule,
    AlumnoModule,
    ProfesorModule,
    AdminModule,
    AlbaranModule,
    DashboardModule,
    PedidoDraftModule,
    RecepcionDraftModule,
    DistribucionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    IsUniqueConstraint,
    {
      provide: APP_GUARD,
      useClass: SmartAuthThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HighTrafficAlertInterceptor,
    },
  ],
})
export class AppModule {}
