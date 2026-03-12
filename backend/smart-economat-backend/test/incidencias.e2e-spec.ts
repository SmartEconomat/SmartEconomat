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
 * Interface simple para tipar respuestas del API en tests.
 */
interface TestApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * @file incidencias.e2e-spec.ts
 * @description Pruebas de integración E2E para el controlador de Incidencias.
 */
describe('IncidenciaController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let profesorToken: string;
  let adminUserId: string;
  let testIncidenciaId: string;
  let recepcionId: string;

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
    adminToken = (
      adminResponse.body as TestApiResponse<{ access_token: string }>
    ).data.access_token;

    const profileResponse = await request(app.getHttpServer() as string)
      .get('/api/v1/usuarios/perfil')
      .set('Authorization', `Bearer ${adminToken}`);
    adminUserId = (profileResponse.body as TestApiResponse<{ id: string }>).data
      .id;

    const profesorResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'profesor1@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    profesorToken = (
      profesorResponse.body as TestApiResponse<{ access_token: string }>
    ).data.access_token;

    const rawRecepcionRes = await request(app.getHttpServer() as string)
      .get('/api/v1/recepcion')
      .set('Authorization', `Bearer ${adminToken}`);

    const resBody = rawRecepcionRes.body as TestApiResponse;
    const recepcionData = resBody.data;

    if (
      recepcionData &&
      typeof recepcionData === 'object' &&
      'data' in recepcionData &&
      Array.isArray(recepcionData.data) &&
      recepcionData.data.length > 0
    ) {
      recepcionId = recepcionData.data[0].id as string;
    } else if (Array.isArray(recepcionData) && recepcionData.length > 0) {
      recepcionId = (recepcionData[0] as { id: string }).id;
    } else {
      console.warn(
        '⚠️ No se encontraron recepciones en los seeders. Usando fallback.'
      );
      recepcionId = '0191c30c-1e55-7000-8000-000000000001';
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Flujo CRUD de Incidencias', () => {
    it('POST /incidencias - Debe crear una incidencia (201)', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/incidencias')
        .set('Authorization', `Bearer ${profesorToken}`)
        .send({
          recepcionId: recepcionId,
          observacionesRecepcion: 'Falta un bulto en la caja 2',
        });

      if (response.status !== 201) {
        console.error(
          'create Response Body:',
          JSON.stringify(response.body, null, 2)
        );
      }
      expect(response.status).toBe(201);
      const resBody = response.body as TestApiResponse<{ id: string }>;
      expect(resBody.data).toHaveProperty('id');
      testIncidenciaId = resBody.data.id;
    });

    it('GET /incidencias - Debe listar las incidencias (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/incidencias')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const resBody = response.body as TestApiResponse<any[]>;
      expect(Array.isArray(resBody.data)).toBe(true);
      expect(resBody.data.length).toBeGreaterThan(0);
    });

    it('GET /incidencias/:id - Debe obtener una incidencia por ID (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get(`/api/v1/incidencias/${testIncidenciaId}`)
        .set('Authorization', `Bearer ${profesorToken}`);

      expect(response.status).toBe(200);
      const resBody = response.body as TestApiResponse<{ id: string }>;
      expect(resBody.data.id).toBe(testIncidenciaId);
    });

    it('PATCH /incidencias/:id - Debe actualizar una incidencia (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/incidencias/${testIncidenciaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          observacionesRecepcion:
            'Actualización: Falta un bulto en la caja 2 y 3',
        });

      expect(response.status).toBe(200);
      const resBody = response.body as TestApiResponse<{
        observacionesRecepcion: string;
      }>;
      expect(resBody.data.observacionesRecepcion).toContain('caja 2 y 3');
    });

    it('PATCH /incidencias/:id/resolver - Debe resolver una incidencia (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/incidencias/${testIncidenciaId}/resolver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          usuarioId: adminUserId,
          observacionesResolucion:
            'Se ha contactado con el proveedor y enviarán el bulto faltante',
        });

      if (response.status !== 200) {
        console.error(
          'resolver Response Body:',
          JSON.stringify(response.body, null, 2)
        );
      }
      expect(response.status).toBe(200);
    });

    it('DELETE /incidencias/:id - Solo administrador puede eliminar (204)', async () => {
      const createRes = await request(app.getHttpServer() as string)
        .post('/api/v1/incidencias')
        .set('Authorization', `Bearer ${profesorToken}`)
        .send({
          recepcionId: recepcionId,
          observacionesRecepcion: 'Incidencia para borrar',
        });

      const resBody = createRes.body as TestApiResponse<{ id: string }>;
      const idToDelete = resBody.data.id;

      const response = await request(app.getHttpServer() as string)
        .delete(`/api/v1/incidencias/${idToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status !== 204) {
        console.error(
          'delete Response Body:',
          JSON.stringify(response.body, null, 2)
        );
      }
      expect(response.status).toBe(204);

      const getRes = await request(app.getHttpServer() as string)
        .get(`/api/v1/incidencias/${idToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.status).toBe(404);
    });
  });

  describe('Validaciones y Errores', () => {
    it('POST /incidencias - Debe fallar sin recepcionId (400)', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/incidencias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          observacionesRecepcion: 'Sin ID',
        });

      expect(response.status).toBe(400);
    });

    it('GET /incidencias/:id - Debe fallar con UUID v7 inválido (400)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/incidencias/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });
});
