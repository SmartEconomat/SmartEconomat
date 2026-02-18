import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proveedor } from './proveedor.entity/proveedor.entity';
import { ProveedorRepository } from './repository/proveedor.repository';
import { ProveedorController } from './controller/proveedor.controller';
import { ProveedorService } from './service/proveedor.service';

@Module({
  imports: [TypeOrmModule.forFeature([Proveedor])],
  controllers: [ProveedorController],
  providers: [ProveedorService, ProveedorRepository],
  exports: [ProveedorService],
})
export class ProveedorModule {}
