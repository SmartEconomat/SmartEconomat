import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProveedorController } from './controller/proveedor.controller';
import { ProveedorService } from './service/proveedor.service';
import { ProveedorRepository } from './repository/proveedor.repository';
import { Proveedor } from './proveedor.entity/proveedor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Proveedor])],
  controllers: [ProveedorController],
  providers: [ProveedorService, ProveedorRepository],
  exports: [ProveedorService, ProveedorRepository],
})
export class ProveedorModule {}
