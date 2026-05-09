import { Module } from '@nestjs/common';
import { ExportService } from './service/export.service';
import { ExportController } from './controller/export.controller';

/** Clase pública (ExportModule). Paquete: smart-economat-backend (Nest). */
@Module({
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
