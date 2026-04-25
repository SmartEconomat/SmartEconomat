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

function deriveFrontendOrigin(): string {
  const domain = (process.env.DOMAIN || '').trim();
  if (!domain) {
    return 'http://localhost:5173';
  }

  if (domain === 'localhost' || domain === '127.0.0.1') {
    const frontendPort = process.env.FRONTEND_PORT || '5173';
    return `http://${domain}:${frontendPort}`;
  }

  return `https://${domain}`;
}

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
    origin: deriveFrontendOrigin(),
    credentials: true,
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  await app.listen(process.env.BACKEND_PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
