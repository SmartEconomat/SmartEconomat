import { getTestApp } from './test-app.helper';
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  INestApplication,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import * as path from 'path';
import * as fs from 'fs';

describe('ArchivoController (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let adminToken: string;
  let archivoId: string;
  const testUploadsDir = path.resolve(
    process.env.LOCAL_STORAGE_PATH || './uploads_test'
  );

  beforeAll(async () => {
    if (!fs.existsSync(testUploadsDir)) {
      fs.mkdirSync(testUploadsDir, { recursive: true });
    }

    app = await getTestApp();

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = response.body.data.access_token;
  });

  afterAll(() => { /* app compartida, no cerrar */ });

  describe('CRUD de Archivos', () => {
    it('POST /archivos/upload - Debe subir un archivo (201)', async () => {
      const buffer = Buffer.from('fake image content');

      const res = await request(app.getHttpServer())
        .post('/api/v1/archivos/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', buffer, {
          filename: 'test-image.png',
          contentType: 'image/png',
        });

      if (res.status !== 201) {
        console.error(
          'SERVER ERROR DURING TEST (UPLOAD):',
          JSON.stringify(res.body, null, 2)
        );
      }
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe('test-image.png');
      expect(res.body.data.mimeType).toBe('image/png');

      archivoId = res.body.data.id;
    });

    it('GET /archivos - Debe listar archivos paginados (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/archivos')
        .set('Authorization', `Bearer ${adminToken}`);

      if (res.status !== 200) {
        console.error(
          'SERVER ERROR DURING TEST (LIST):',
          JSON.stringify(res.body, null, 2)
        );
      }
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /archivos/:id - Debe obtener detalles del archivo (200)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/archivos/${archivoId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (res.status !== 200) {
        console.error(
          'SERVER ERROR DURING TEST (GET BY ID):',
          JSON.stringify(res.body, null, 2)
        );
      }
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(archivoId);
    });

    it('DELETE /archivos/:id - Debe eliminar archivo (soft delete) (204)', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/archivos/${archivoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('GET /archivos/:id - Debe dar 404 para archivo eliminado', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/archivos/${archivoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
