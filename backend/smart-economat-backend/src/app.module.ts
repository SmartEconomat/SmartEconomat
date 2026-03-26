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

import { ProductoAlergeno } from './modules/producto/producto-alergeno.entity/producto-alergeno.entity';
import { ProductoProveedor } from './modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { HistorialPrecio } from './modules/producto/historial-precio-proveedor.entity/historial.entity';
import { Producto } from './modules/producto/producto.entity/producto.entity';
import { PlantillaRol } from './modules/plantillas-roles/plantilla-rol.entity/plantilla-rol.entity';
import { PlantillaRolPermiso } from './modules/plantillas-roles/plantilla-rol-permiso.entity/plantilla-rol-permiso.entity';
import { Alumno } from './modules/alumno/alumno.entity/alumno.entity';
import { RecepcionDraft } from './modules/recepcion-draft/recepcion-draft.entity/recepcion-draft.entity';
import { PurchaseBatch } from './modules/pedido/purchase-batch.entity/purchase-batch.entity';
import { Pedido } from './modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from './modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { RolPermiso } from './modules/roles/rol-permiso.entity/rol-permiso.entity';
import { UsuarioRol } from './modules/roles/usuario-rol.entity/usuario-rol.entity';
import { Rol } from './modules/roles/rol.entity/rol.entity';
import { Movimiento } from './modules/movimiento/movimiento.entity/movimiento.entity';
import { AlbaranPedidoRecepcion } from './modules/albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';
import { Albaran } from './modules/albaran/albaran.entity/albaran.entity';
import { Recepcion } from './modules/recepcion/recepcion.entity/recepcion.entity';
import { RecepcionPedido } from './modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from './modules/recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { IncidenciaResuelta } from './modules/incidencia/incidencia-resuelta.entity/incidencia-resuelta.entity';
import { Incidencia } from './modules/incidencia/incidencia.entity/incidencia.entity';
import { IncidenciaLinea } from './modules/incidencia/incidencia-linea.entity/incidencia-linea.entity';
import { Archivo } from './modules/archivo/archivo.entity/archivo.entity';
import { AlumnoSlot } from './modules/profesor/profesor.entity/alumno-slot.entity';
import { Profesor } from './modules/profesor/profesor.entity/profesor.entity';
import { Permiso } from './modules/permisos/permiso.entity/permiso.entity';
import { Proveedor } from './modules/proveedor/proveedor.entity/proveedor.entity';
import { Merma } from './modules/merma/merma.entity/merma.entity';
import { RecetaIngrediente } from './modules/receta/receta-ingrediente.entity/receta-ingrediente.entity';
import { ProduccionLote } from './modules/receta/produccion-lote.entity/produccion-lote.entity';
import { Receta } from './modules/receta/receta.entity/receta.entity';
import { PedidoDraft } from './modules/pedido-draft/pedido-draft.entity/pedido-draft.entity';
import { Inventario } from './modules/inventario/inventario.entity/inventario.entity';
import { Ubicacion } from './modules/ubicacion/ubicacion.entity/ubicacion.entity';
import { Preparacion } from './modules/preparacion/preparacion.entity/preparacion.entity';
import { Usuario } from './modules/usuario/usuario.entity/usuario.entity';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000,
      max: 100,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'write',
        ttl: 60000,
        limit: 200,
      },
      {
        name: 'read',
        ttl: 60000,
        limit: 1000,
      },
    ]),
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async (): Promise<TypeOrmModuleOptions> => {
        if (process.env.NODE_ENV === 'test') {
          const pgMem = require('../test/setup/pg-mem') as {
            getTestDataSource: () => import('typeorm').DataSource;
          };
          const ds = pgMem.getTestDataSource();
          if (ds && typeof ds === 'object' && 'isInitialized' in ds) {
            if (!ds.isInitialized) {
              await ds.initialize();
            }
            return {
              type: 'postgres',
              entities: [
                ProductoAlergeno,
                ProductoProveedor,
                HistorialPrecio,
                Producto,
                PlantillaRol,
                PlantillaRolPermiso,
                Alumno,
                RecepcionDraft,
                PurchaseBatch,
                Pedido,
                PedidoProducto,
                RolPermiso,
                UsuarioRol,
                Rol,
                Movimiento,
                AlbaranPedidoRecepcion,
                Albaran,
                Recepcion,
                RecepcionPedido,
                RecepcionProducto,
                IncidenciaResuelta,
                Incidencia,
                IncidenciaLinea,
                Archivo,
                AlumnoSlot,
                Profesor,
                Permiso,
                Proveedor,
                Merma,
                RecetaIngrediente,
                ProduccionLote,
                Receta,
                PedidoDraft,
                Inventario,
                Ubicacion,
                Preparacion,
                Usuario,
              ],
              migrations: ds.options.migrations,
              synchronize: false,
              logging: false,
            };
          }
        }
        return { ...typeOrmConfig };
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
