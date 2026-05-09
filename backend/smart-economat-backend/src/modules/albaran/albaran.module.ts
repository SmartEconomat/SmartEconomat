import { Module, BadRequestException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { Albaran } from './albaran.entity/albaran.entity';
import { AlbaranPedidoRecepcion } from './albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';
import { AlbaranController } from './controller/albaran.controller';
import { AlbaranService } from './service/albaran.service';
import { AlbaranRecepcionListener } from './listeners/albaran-recepcion.listener';
import { I18nHelper } from '../../common/helpers/i18n.helper';
import { ArchivoModule } from '../archivo/archivo.module';
import { resolveWritableLocalStoragePath } from '../../common/utils/local-storage-path.util';

/** Clase pública (AlbaranModule). Paquete: smart-economat-backend (Nest). */
@Module({
  imports: [
    TypeOrmModule.forFeature([Albaran, AlbaranPedidoRecepcion]),
    ConfigModule,
    ArchivoModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const configuredUploadDir =
          configService.get<string>('LOCAL_STORAGE_PATH');
        const uploadDir = resolveWritableLocalStoragePath(configuredUploadDir);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        return {
          storage: diskStorage({
            destination: uploadDir,
            filename: (_req, file, cb) => {
              const uniqueFileName = `albaran_${randomUUID()}${extname(file.originalname)}`;
              cb(null, uniqueFileName);
            },
          }),
          limits: {
            fileSize:
              configService.get<number>('MAX_FILE_SIZE_MB', 10) * 1024 * 1024,
          },
          fileFilter: (
            _req: unknown,
            file: Express.Multer.File,
            cb: (error: Error | null, acceptFile: boolean) => void
          ) => {
            if (file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf)$/)) {
              cb(null, true);
            } else {
              cb(
                new BadRequestException(
                  I18nHelper.getError('TIPO_DE_ARCHIVO_NO_SOPORTADO')
                ),
                false
              );
            }
          },
        };
      },
    }),
  ],
  controllers: [AlbaranController],
  providers: [AlbaranService, AlbaranRecepcionListener],
  exports: [AlbaranService],
})
export class AlbaranModule {}
