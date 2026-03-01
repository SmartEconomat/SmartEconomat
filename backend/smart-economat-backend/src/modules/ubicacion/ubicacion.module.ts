import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UbicacionService } from './service/ubicacion.service';
import { UbicacionController } from './controller/ubicacion.controller';
import { Ubicacion } from './ubicacion.entity/ubicacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ubicacion])],
  controllers: [UbicacionController],
  providers: [UbicacionService],
  exports: [UbicacionService],
})
export class UbicacionModule {}
