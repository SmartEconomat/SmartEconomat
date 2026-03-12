import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { I18nService } from 'nestjs-i18n';

/**
 * @file dashboard.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Dashboard.
 * Verifica la obtención de estadísticas y KPIs.
 */
describe('DashboardController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
      new TransformInterceptor()
    );
    app.useGlobalFilters(new GlobalExceptionFilter(app.get(I18nService)));
    await app.init();

    const response = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = response.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Estadísticas', () => {
    /**
     * @test Debe obtener las estadísticas generales del dashboard.
     */
    it('GET /api/v1/dashboard/stats - Debe retornar estadísticas (200)', () => {
      return request(app.getHttpServer() as string)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('inventario');
          expect(res.body.data).toHaveProperty('pedidos');
          expect(res.body.data).toHaveProperty('alertas');
        });
    });

    /**
     * @test Debe denegar el acceso a las estadísticas si no hay token.
     */
    it('GET /api/v1/dashboard/stats - Debe fallar sin token (401)', () => {
      return request(app.getHttpServer() as string)
        .get('/api/v1/dashboard/stats')
        .expect(401);
    });
  });
});
