import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';

/**
 * Documentación en español.
 */
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await getTestApp();
  });

  afterAll(() => {
    /* app compartida, no cerrar */
  });

  describe('POST /auth/register', () => {
    const newUser = {
      username: `user_${Date.now()}`,
      email: `auth_${Date.now()}@test.com`,
      password: 'Password123!',
    };

                /**
         * Documentación en español.
         */
    it('Debe registrar un nuevo usuario (201) y no permitir duplicados (409)', async () => {
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(201);

      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(409);
    });

                /**
         * Documentación en español.
         */
    it('Debe fallar si el password es débil (400)', async () => {
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/register')
        .send({ ...newUser, password: '123', username: 'fail' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
                /**
         * Documentación en español.
         */
    it('Debe loguear correctamente (200)', async () => {
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@smarteconomat.com',
          password: 'SmartEconomat2026!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('access_token');
        });
    });

                /**
         * Documentación en español.
         */
    it('Debe fallar con password erróneo (400)', async () => {
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@smarteconomat.com',
          password: 'wrongpassword',
        })
        .expect(400);
    });

                /**
         * Documentación en español.
         */
    it('Debe fallar con email inexistente (400)', async () => {
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        })
        .expect(400);
    });
  });
});
