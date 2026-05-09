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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
