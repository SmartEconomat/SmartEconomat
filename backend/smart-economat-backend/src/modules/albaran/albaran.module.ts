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
import { I18nHelper } from '../../common/helpers/i18n.helper';
import { ArchivoModule } from '../archivo/archivo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Albaran, AlbaranPedidoRecepcion]),
    ConfigModule,
    ArchivoModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uploadDir = configService.get<string>(
          'LOCAL_STORAGE_PATH',
          './uploads'
        );
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
          fileFilter: (_req: any, file: any, cb: any) => {
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
  providers: [AlbaranService],
  exports: [AlbaranService],
})
export class AlbaranModule {}
