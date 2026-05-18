import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Swagger solo en entornos no productivos o cuando ENABLE_SWAGGER=true explícitamente.
 * Producción por defecto: sin UI ni ruta /docs (menor superficie de ataque).
 */
export function isSwaggerEnabled(): boolean {
  const flag = (process.env.ENABLE_SWAGGER ?? '').trim().toLowerCase();
  if (flag === 'true' || flag === '1' || flag === 'yes') {
    return true;
  }
  if (flag === 'false' || flag === '0' || flag === 'no') {
    return false;
  }
  return process.env.NODE_ENV !== 'production';
}

/**
 * Monta OpenAPI en /docs si el entorno lo permite.
 */
export function setupSwagger(app: INestApplication): void {
  if (!isSwaggerEnabled()) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('SmartEconomat API')
    .setDescription('API for economat and stock management')
    .setVersion('1.0')
    .addTag('SmartEconomat')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
