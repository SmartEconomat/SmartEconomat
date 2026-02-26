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
 * @file movimientos.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Movimientos de Stock.
 * Cubre la visualización y gestión de movimientos.
 */
describe('MovimientoController (e2e)', () => {
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

  describe('Listado y Gestión', () => {
    /**
     * @test Debe listar todos los movimientos registrados.
     */
    it('GET /movimientos - Debe listar movimientos (200)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/movimientos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    /**
     * @test Debe permitir obtener el historial filtrado (debe incluir entityId).
     */
    it('GET /movimientos/historial - Debe retornar historial (200 o 404)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/movimientos/historial')
        .query({ entityId: '019c9b4f-74f8-7a6e-8b5b-96191c30c1e5' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    /**
     * @test Debe fallar con 404 al intentar eliminar un movimiento inexistente.
     */
    it('DELETE /movimientos/:id - Debe fallar con UUID inexistente (404)', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/movimientos/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
