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

/**
 * @file auth.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Autenticación.
 * Cubre registro de usuarios, inicio de sesión y validaciones de seguridad.
 */
describe('AuthController (e2e)', () => {
  let app: INestApplication;

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
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    const newUser = {
      nombre: 'Test User Auth',
      username: `user_${Date.now()}`,
      email: `auth_${Date.now()}@test.com`,
      password: 'Password123!',
    };

    /**
     * @test Debe registrar un nuevo usuario correctamente (camino feliz).
     */
    it('Debe registrar un nuevo usuario (201)', async () => {
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('access_token');
        });
    });

    /**
     * @test No debe permitir registrar un usuario con el mismo email/username (conflicto).
     */
    it('No debe permitir duplicados (409)', async () => {
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
