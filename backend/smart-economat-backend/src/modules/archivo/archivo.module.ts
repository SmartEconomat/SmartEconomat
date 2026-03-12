import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ArchivoController } from './controller/archivo.controller';
import { ArchivoService } from './service/archivo.service';
import { Archivo } from './archivo.entity/archivo.entity';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { I18nHelper } from '../../common/helpers/i18n.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([Archivo]),
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
            filename: (req, file, cb) => {
              const uniqueFileName = `${randomUUID()}${extname(file.originalname)}`;
              cb(null, uniqueFileName);
            },
          }),
          limits: {
            fileSize:
              configService.get<number>('MAX_FILE_SIZE_MB', 10) * 1024 * 1024,
          },
          fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf)$/)) {
              cb(null, true);
            } else {
              cb(
                new BadRequestException(I18nHelper.getError('TIPO_DE_ARCHIVO_NO_SOPORTADO')),
                false
              );
            }
          },
        };
      },
    }),
  ],
  controllers: [ArchivoController],
  providers: [ArchivoService],
  exports: [ArchivoService],
})
export class ArchivoModule {}
