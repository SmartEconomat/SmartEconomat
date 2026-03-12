import { getTestApp } from './test-app.helper';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';

/**
 * @file auth.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Autenticación.
 * Cubre registro de usuarios, inicio de sesión y validaciones de seguridad.
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
      nombre: 'Test User Auth',
      username: `user_${Date.now()}`,
      email: `auth_${Date.now()}@test.com`,
      password: 'Password123!',
    };

    /**
     * @test Debe registrar un nuevo usuario y denegar duplicados.
     */
    it('Debe registrar un nuevo usuario (201) y no permitir duplicados (409)', async () => {
      // Primero registramos
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(201);

      // Segundo intentamos duplicar
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(409);
    });

    /**
     * @test Debe validar que el password cumpla con los requisitos mínimos.
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
     * @test Debe permitir el acceso con credenciales correctas.
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
     * @test Debe denegar el acceso con contraseña incorrecta.
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
     * @test Debe fallar con un email no registrado.
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
