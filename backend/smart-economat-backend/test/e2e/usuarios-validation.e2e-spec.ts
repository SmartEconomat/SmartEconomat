import { getTestApp } from '../setup/test-app';
import { Server } from 'http';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('Usuario Validation (e2e)', () => {
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

    const usersRes = await request(app.getHttpServer() as string)
      .get('/api/v1/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);

    const profileRes = await request(app.getHttpServer() as string)
      .get('/api/v1/usuarios/perfil')
      .set('Authorization', `Bearer ${adminToken}`);
    const adminId = profileRes.body.data.id;

    testUserId = usersRes.body.data.data.find((u: any) => u.id !== adminId)?.id;
  });

  it('PATCH /usuarios/:id - Debe aceptar el campo "nombre" (200)', async () => {
    if (!testUserId) return;
    const nuevoNombre = 'Prueba Nombre Real';
    await request(app.getHttpServer() as Server)
      .patch(`/api/v1/usuarios/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: nuevoNombre })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.nombre).toBe(nuevoNombre);
      });
  });

  it('PATCH /usuarios/:id - Debe rechazar campos no permitidos (p.ej. permisosAdicionalesIds) (400)', async () => {
    if (!testUserId) return;

    await request(app.getHttpServer() as Server)
      .patch(`/api/v1/usuarios/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'test_user_valid',
        permisosAdicionalesIds: ['algun-uuid'],
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toBeDefined();

        if (Array.isArray(res.body.message)) {
          expect(
            res.body.message.some((m: string) =>
              m.includes('property permisosAdicionalesIds should not exist')
            )
          ).toBe(true);
        }
      });
  });

  it('POST /usuarios - Debe aceptar el campo "nombre" en creación (201)', async () => {
    const uniqueUsername = `user_${Date.now()}`;
    await request(app.getHttpServer() as Server)
      .post('/api/v1/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: uniqueUsername,
        nombre: 'Usuario Nuevo Seeder',
        email: `${uniqueUsername}@example.com`,
        password: 'Password123!',
        rol: 'ALUMNO',
        status: 'ACTIVE',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.data.nombre).toBe('Usuario Nuevo Seeder');
      });
  });
});
