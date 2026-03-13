import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserStatus } from '../../src/modules/usuario/enums/usuario.enums';

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let profesorToken: string;

  beforeAll(async () => {
    app = await getTestApp();

    const adminResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = adminResponse.body.data.access_token;

    const profResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'profesor1@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    profesorToken = profResponse.body.data.access_token;
  });

  describe('Gestión de Profesores (POST /admin/profesores)', () => {
    it('E2E-ADM-01-CRE-PROF: Registro exitoso de un profesor', async () => {
      const username = `profe_admin_${Date.now()}`;
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/admin/profesores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username,
          password: 'Password123!',
          email: `${username}@example.com`,
          cial: `CIAL_${Date.now()}`,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe(UserStatus.INACTIVE);
      expect(response.body.data.username).toBe(username);
    });

    it('E2E-ADM-02-CRE-ERR-UNI: Error 409 por duplicado', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/admin/profesores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'admin',
          password: 'Password123!',
          email: 'admin@smarteconomat.com',
          cial: 'CIAL_NEW',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('Mantenimiento de Cuentas (PATCH /admin/users/:id/activate)', () => {
    let testUserId: string;

    beforeEach(async () => {
      const username = `user_to_activate_${Date.now()}`;
      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/admin/profesores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username,
          password: 'Password123!',
          email: `${username}@example.com`,
          cial: `CIAL_ACT_${Date.now()}`,
        });
      testUserId = res.body.data.user_id;
    });

    it('E2E-ADM-05-ACT: Activar un usuario inactivo', async () => {
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/admin/users/${testUserId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(UserStatus.ACTIVE);
    });

    it('E2E-ADM-06-ACT-ERR: Error 400 ya activo', async () => {
      await request(app.getHttpServer() as string)
        .patch(`/api/v1/admin/users/${testUserId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/admin/users/${testUserId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Recuperación y Seguridad (POST /admin/users/:id/force-reset)', () => {
    let testUserId: string;

    beforeEach(async () => {
      const username = `user_to_reset_${Date.now()}`;
      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/admin/profesores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username,
          password: 'Password123!',
          email: `${username}@example.com`,
          cial: `CIAL_RST_${Date.now()}`,
        });
      testUserId = res.body.data.user_id;
    });

    it('E2E-ADM-08-FRS: Forzar reseteo de contraseña', async () => {
      const response = await request(app.getHttpServer() as string)
        .post(`/api/v1/admin/users/${testUserId}/force-reset`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('provisionalPassword');
      expect(response.body.data.mustChangePassword).toBe(true);
    });
  });

  describe('Seguridad y RBAC', () => {
    it('E2E-ADM-11-SEC-FORB: Profesor no puede acceder a admin', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/admin/profesores')
        .set('Authorization', `Bearer ${profesorToken}`)
        .send({});

      expect(response.status).toBe(403);
    });
  });
});
