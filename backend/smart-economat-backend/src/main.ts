import './instrument';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { I18nValidationPipe } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import cookieParser from 'cookie-parser';
import { useContainer } from 'class-validator';
import { NormalizeDataPipe } from './common/pipes/normalize-data.pipe';

import helmet from 'helmet';

/**
 * @description Application bootstrap function.
 * Creates and configures the NestJS application instance:
 * - Sets the global API prefix (`api/v1`).
 * - Applies security middleware: `cookie-parser` and `helmet`.
 * - Configures Swagger documentation at `/docs`.
 * - Registers global validation pipes (`NormalizeDataPipe`, `I18nValidationPipe`).
 * - Registers the global exception filter and response-transform interceptors.
 * - Enables CORS with origin from `FRONTEND_API_URL` env var.
 * - Enables `trust proxy` for deployments behind a reverse proxy.
 * - Starts listening on `BACKEND_PORT` (default 3000) on all interfaces.
 * @returns {Promise<void>}
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.use(helmet());

  const config = new DocumentBuilder()
    .setTitle('SmartEconomat API')
    .setDescription('API para la gestión de economato y stock')
    .setVersion('1.0')
    .addTag('SmartEconomat')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(
    new NormalizeDataPipe(),
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor()
  );

  app.enableCors({
    origin: process.env.FRONTEND_API_URL || '*',
    credentials: true,
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  await app.listen(process.env.BACKEND_PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
