import { getTestApp } from './test-app.helper';
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';

import request from 'supertest';
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

  beforeEach(async () => {
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

    // Subir un archivo base para los tests de GET, DELETE
    const buffer = Buffer.from('fake image content');
    const res = await request(app.getHttpServer())
      .post('/api/v1/archivos/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', buffer, {
        filename: 'base-image.png',
        contentType: 'image/png',
      });
    archivoId = res.body.data.id;
  });

  describe('CRUD de Archivos', () => {
    it('POST /archivos/upload - Debe subir un archivo (201)', async () => {
      const buffer = Buffer.from('new image content');

      const res = await request(app.getHttpServer())
        .post('/api/v1/archivos/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', buffer, {
          filename: 'test-image.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe('test-image.png');
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

    it('DELETE /archivos/:id - Debe eliminar archivo (soft delete) y dar 404 después', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/archivos/${archivoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/archivos/${archivoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
