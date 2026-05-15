import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('UbicacionController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let testUbicacionId: string;

  beforeAll(async () => {
    app = await getTestApp();

    const adminResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });

    adminToken = adminResponse.body?.data?.access_token;
  });

  beforeEach(async () => {
    const response = await request(app.getHttpServer() as string)
      .post('/api/v1/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Ubicacion E2E ${Date.now()}-${Math.random()}`,
        descripcion: 'Descripción de test',
      });

    if (response.status !== 201) {
      console.log('ERROR UBICACION CREATE:', response.status, response.body);
    }
    testUbicacionId = response.body.data.id;
  });

  describe('Seguridad y Autorización', () => {
    it('GET /ubicacion - Debe fallar sin token (401)', async () => {
      const response = await request(app.getHttpServer() as string).get(
        '/api/v1/ubicaciones'
      );
      expect(response.status).toBe(401);
    });
  });

  describe('CRUD de Ubicaciones', () => {
    it('POST /ubicacion - Debe crear una ubicación (201)', async () => {
      const nombre = `Almacén de Test ${Date.now()}`;
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/ubicaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre,
          descripcion: 'Descripción de test para ubicación',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.nombre).toBe(nombre);
    });

    it('POST /ubicacion - Debe fallar si el nombre ya existe (400/409)', async () => {
      const responseGet = await request(app.getHttpServer() as string)
        .get(`/api/v1/ubicaciones/${testUbicacionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const nombreExistente = responseGet.body.data.nombre;

      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/ubicaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: nombreExistente,
          descripcion: 'Duplicado',
        });

      expect([400, 409]).toContain(response.status);
    });

    it('GET /ubicacion - Debe listar ubicaciones con paginación (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/ubicaciones')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('data');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
    });

    it('GET /ubicacion/:id - Debe obtener una ubicación específica (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get(`/api/v1/ubicaciones/${testUbicacionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testUbicacionId);
    });

    it('GET /ubicacion/:id - Debe devolver 404 para ID inexistente (Formato UUIDv7 válido)', async () => {
      const fakeId = '018f0000-0000-7000-8000-000000000000';
      const response = await request(app.getHttpServer() as string)
        .get(`/api/v1/ubicaciones/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('PATCH /ubicacion/:id - Debe actualizar una ubicación (200)', async () => {
      const nuevoNombre = `Actualizado ${Date.now()}`;
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/ubicaciones/${testUbicacionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: nuevoNombre,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.nombre).toBe(nuevoNombre);
    });

    it('DELETE /ubicacion/:id - Debe eliminar una ubicación lógicamente (200)', async () => {
      const responseDelete = await request(app.getHttpServer() as string)
        .delete(`/api/v1/ubicaciones/${testUbicacionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(responseDelete.status).toBe(200);

      const responseGet = await request(app.getHttpServer() as string)
        .get(`/api/v1/ubicaciones/${testUbicacionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(responseGet.status).toBe(404);
    });

    it('POST /ubicacion/:id/restore - Debe restaurar una ubicación eliminada (201)', async () => {
      await request(app.getHttpServer() as string)
        .delete(`/api/v1/ubicaciones/${testUbicacionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const responseRestore = await request(app.getHttpServer() as string)
        .post(`/api/v1/ubicaciones/${testUbicacionId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(responseRestore.status).toBe(201);

      const responseGet = await request(app.getHttpServer() as string)
        .get(`/api/v1/ubicaciones/${testUbicacionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(responseGet.status).toBe(200);
      expect(responseGet.body.data.id).toBe(testUbicacionId);
    });
  });
});
