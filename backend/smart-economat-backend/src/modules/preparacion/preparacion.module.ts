import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Preparacion } from './preparacion.entity/preparacion.entity';
import { Receta } from '../receta/receta.entity/receta.entity';
import { PreparacionService } from './service/preparacion.service';
import { PreparacionController } from './controller/preparacion.controller';
import { PreparacionRepository } from './repository/preparacion.repository';
import { RecetaModule } from '../receta/receta.module';
import { UsuarioModule } from '../usuario/usuario.module';

/**
 * @module PreparacionModule
 * @description Feature module that manages kitchen preparation orders.
 *
 * Imports `RecetaModule` directly (no `forwardRef` needed — there is no circular dependency)
 * so that `RecetaService`, `ProduccionService` and `RecetaRepository` are available for
 * injection.  Both `Preparacion` and `Receta` are registered in `TypeOrmModule.forFeature`
 * so TypeORM can resolve the `Preparacion#receta` relation eagerly, preventing the
 * "Entity metadata for Preparacion#receta was not found" error that occurs when the
 * target entity is only registered in a deferred (forwardRef) module.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Preparacion, Receta]),
    UsuarioModule,
    RecetaModule,
  ],
  providers: [PreparacionService, PreparacionRepository],
  controllers: [PreparacionController],
  exports: [PreparacionService, PreparacionRepository],
})
export class PreparacionModule {}
