import { getTestApp } from '../setup/test-app';
import { Server } from 'http';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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

    it('PATCH /usuarios/perfil/mis-ubicaciones - Debe vincular ubicaciones válidas (200)', async () => {
      const ubiRes = await request(app.getHttpServer() as Server)
        .post('/api/v1/ubicacion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: `Perfil ubicación E2E ${Date.now()}`,
          descripcion: 'asignación usuario',
        })
        .expect(201);

      const ubicacionId = ubiRes.body.data.id as string;

      await request(app.getHttpServer() as Server)
        .patch('/api/v1/usuarios/perfil/mis-ubicaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ubicacionesIds: [ubicacionId],
          ubicacionPredeterminadaId: ubicacionId,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.ubicacionId).toBe(ubicacionId);
        });

      const perfil = await request(app.getHttpServer() as Server)
        .get('/api/v1/usuarios/perfil')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(perfil.body.data.ubicacionId).toBe(ubicacionId);
    });

    it('PATCH /usuarios/perfil/mis-ubicaciones - Debe fallar con ubicacionesIds inexistente (404)', async () => {
      await request(app.getHttpServer() as Server)
        .patch('/api/v1/usuarios/perfil/mis-ubicaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ubicacionesIds: ['01900000-0000-7000-8000-000000000099'],
        })
        .expect(404);
    });

    it('PATCH /usuarios/perfil - debe rechazar campos de ubicación (whitelist)', async () => {
      await request(app.getHttpServer() as Server)
        .patch('/api/v1/usuarios/perfil')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ubicacionId: '01900000-0000-7000-8000-000000000099',
        })
        .expect(400);
    });
  });

  describe('Administración (Solo Admin)', () => {
    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /usuarios/:id - Debe obtener un usuario (200)', async () => {
      if (!testUserId) return;
      await request(app.getHttpServer() as Server)
        .get(`/api/v1/usuarios/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /usuarios/:id - Debe fallar con UUID inválido (400)', async () => {
      await request(app.getHttpServer() as string)
        .get('/api/v1/usuarios/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });
});
