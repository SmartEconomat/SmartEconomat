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
 * @file recepcion-stock.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Procesamiento de Recepción de Stock.
 * Verifica la creación y validación de recepciones vinculadas a pedidos.
 */
describe('RecepcionStockController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let adminUserId: string;

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

    const profileResponse = await request(app.getHttpServer())
      .get('/api/v1/usuarios/perfil')
      .set('Authorization', `Bearer ${adminToken}`);
    adminUserId = profileResponse.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Procesar Recepción', () => {
    /**
     * @test Debe fallar con error 400 si se envía un cuerpo vacío o inválido.
     */
    it('POST /recepcion-stock - Debe fallar con body vacío (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/recepcion-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    /**
     * @test Debe fallar si el pedidoReferencia no existe.
     */
    it('POST /recepcion-stock - Debe fallar si el pedidoId no existe (404/400 según lógica)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/recepcion-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pedidoId: '00000000-0000-0000-0000-000000000000',
          usuarioId: adminUserId,
          lineas: [],
        })
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });
    });
  });
});
