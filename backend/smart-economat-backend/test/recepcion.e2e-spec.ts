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

/**
 * @file recepcion.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Recepciones generales.
 * Verifica la gestión de albaranes y estados de recepción.
 */
describe('RecepcionController (e2e)', () => {
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
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: '123456',
      });
    adminToken = response.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Listado y Gestión de Albaranes', () => {
    /**
     * @test Debe listar todas las recepciones registradas en el sistema.
     */
    it('GET /api/v1/recepcion - Debe listar recepciones (200)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/recepcion')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    /**
     * @test Debe dar error al intentar obtener una recepción inexistente.
     */
    it('GET /api/v1/recepcion/:id - Debe devolver 404 (Not Found) para ID inexistente', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/recepcion/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
