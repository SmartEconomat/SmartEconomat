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

describe('UbicacionController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let testUbicacionId: string;

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

    const adminResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = adminResponse.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CRUD de Ubicaciones', () => {
    it('POST /ubicacion - Debe crear una ubicación (201)', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/ubicacion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Almacén de Test',
          descripcion: 'Descripción de test para ubicación',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      testUbicacionId = response.body.data.id;
    });

    it('GET /ubicacion - Debe listar ubicaciones (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/ubicacion')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /ubicacion/:id - Debe obtener una ubicación (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get(`/api/v1/ubicacion/${testUbicacionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testUbicacionId);
    });

    it('PATCH /ubicacion/:id - Debe actualizar una ubicación (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/ubicacion/${testUbicacionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Almacén Actualizado',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.nombre).toBe('Almacén Actualizado');
    });

    it('DELETE /ubicacion/:id - Debe eliminar una ubicación (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .delete(`/api/v1/ubicacion/${testUbicacionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('POST /ubicacion/:id/restore - Debe restaurar una ubicación (201)', async () => {
      const response = await request(app.getHttpServer() as string)
        .post(`/api/v1/ubicacion/${testUbicacionId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(201);
    });
  });
});
