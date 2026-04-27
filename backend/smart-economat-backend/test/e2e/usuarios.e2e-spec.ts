import { getTestApp } from '../setup/test-app';
import { Server } from 'http';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';

/**
 * Documentación en español.
 */
describe('UsuarioController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = await getTestApp();

    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = response.body.data.access_token;
  });

  afterAll(() => {
    /* app compartida, no cerrar */
  });

  describe('Perfil (Auto-servicio)', () => {
    /**
     * Documentación en español.
     */
    it('GET /usuarios/perfil - Debe obtener mi perfil (200)', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/usuarios/perfil')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe('admin@smarteconomat.com');
        });
    });

    /**
     * Documentación en español.
     */
    it('PATCH /usuarios/perfil - Debe actualizar mi nombre de usuario (200)', async () => {
      await request(app.getHttpServer() as Server)
        .patch('/api/v1/usuarios/perfil')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'admin_master' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.username).toBe('admin_master');
        });
    });

    /**
     * Documentación en español.
     */
    it('PATCH /usuarios/perfil/password - Debe cambiar contraseña validando la anterior (200)', async () => {
      await request(app.getHttpServer() as Server)
        .patch('/api/v1/usuarios/perfil/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ oldPassword: 'wrong', newPassword: 'NewPassword123!' })
        .expect(401);

      await request(app.getHttpServer() as Server)
        .patch('/api/v1/usuarios/perfil/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          oldPassword: 'SmartEconomat2026!',
          newPassword: 'NewPassword123!',
        })
        .expect(200);

      await request(app.getHttpServer() as Server)
        .patch('/api/v1/usuarios/perfil/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          oldPassword: 'NewPassword123!',
          newPassword: 'SmartEconomat2026!',
        })
        .expect(200);
    });
  });

  describe('Administración (Solo Admin)', () => {
    /**
     * Documentación en español.
     */
    it('GET /usuarios - Debe listar usuarios (200)', async () => {
      const res = await request(app.getHttpServer() as string)
        .get('/api/v1/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data.data)).toBe(true);
      const profileRes = await request(app.getHttpServer() as string)
        .get('/api/v1/usuarios/perfil')
        .set('Authorization', `Bearer ${adminToken}`);
      const adminId = (profileRes.body as { data: { id: string } }).data.id;

      const users = res.body.data.data as Array<{ id: string }>;
      const otherUser = users.find((u) => u.id !== adminId);
      if (otherUser) {
        testUserId = otherUser.id;
      }
    });

    /**
     * Documentación en español.
     */
    it('GET /usuarios/:id - Debe obtener un usuario (200)', async () => {
      if (!testUserId) return;
      await request(app.getHttpServer() as Server)
        .get(`/api/v1/usuarios/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    /**
     * Documentación en español.
     */
    it('PATCH /usuarios/:id/activar - Debe cambiar estado activo (200)', async () => {
      if (!testUserId) return;
      await request(app.getHttpServer() as Server)
        .patch(`/api/v1/usuarios/${testUserId}/activar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' })
        .expect(200);
    });

    /**
     * Documentación en español.
     */
    it('PATCH /usuarios/:id/rol - Debe cambiar el rol (200)', async () => {
      if (!testUserId) return;
      await request(app.getHttpServer() as Server)
        .patch(`/api/v1/usuarios/${testUserId}/rol`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rol: 'PROFESOR' })
        .expect(200);
    });

    /**
     * Documentación en español.
     */
    it('GET /usuarios/:id - Debe fallar con UUID inválido (400)', async () => {
      await request(app.getHttpServer() as string)
        .get('/api/v1/usuarios/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });
});
