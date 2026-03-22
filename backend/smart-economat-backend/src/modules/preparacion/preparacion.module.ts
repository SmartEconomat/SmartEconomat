import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Preparacion } from './preparacion.entity/preparacion.entity';
import { PreparacionService } from './service/preparacion.service';
import { PreparacionController } from './controller/preparacion.controller';
import { PreparacionRepository } from './repository/preparacion.repository';
import { RecetaModule } from '../receta/receta.module';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Preparacion]),
    UsuarioModule,
    forwardRef(() => RecetaModule),
  ],
  providers: [PreparacionService, PreparacionRepository],
  controllers: [PreparacionController],
  exports: [PreparacionService, PreparacionRepository],
})
export class PreparacionModule {}
