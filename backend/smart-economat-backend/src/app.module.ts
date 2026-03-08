import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoModule } from './modules/pedido/pedido.module';
import { ProductoModule } from './modules/producto/producto.module';
import { ProveedorModule } from './modules/proveedor/proveedor.module';
import { MovimientoModule } from './modules/movimiento/movimiento.module';
import { typeOrmConfig } from './config/database.config';
import { I18nConfigModule } from './config/i18n.module';
import { RecepcionModule } from './modules/recepcion/recepcion.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { RecetaModule } from './modules/receta/receta.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { AlbaranModule } from './modules/albaran/albaran.module';
import { UbicacionModule } from './modules/ubicacion/ubicacion.module';
import { IncidenciaModule } from './modules/incidencia/incidencia.module';
import { ArchivoModule } from './modules/archivo/archivo.module';
import { ProfesorModule } from './modules/profesor/profesor.module';
import { AlumnoModule } from './modules/alumno/alumno.module';
import { AdminModule } from './modules/admin/admin.module';
import { PermisosModule } from './modules/permisos/permisos.module';
import { AuthorizationModule } from './modules/authorization/authorization.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    I18nConfigModule,
    UsuarioModule,
    PedidoModule,
    ProductoModule,
    MovimientoModule,
    RecepcionModule,
    RecetaModule,
    ProveedorModule,
    DashboardModule,
    InventarioModule,
    AlbaranModule,
    UbicacionModule,
    IncidenciaModule,
    ArchivoModule,
    ProfesorModule,
    AlumnoModule,
    AdminModule,
    PermisosModule,
    AuthorizationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
