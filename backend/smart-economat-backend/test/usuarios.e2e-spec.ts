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

describe('Auth & Usuarios (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

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

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: '123456',
      });

    adminToken = response.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Flujo de Perfil y Password', () => {
    it('Debe obtener el perfil del admin logueado', () => {
      return request(app.getHttpServer())
        .get('/api/v1/usuarios/perfil')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe('admin@smarteconomat.com');
          expect(res.body.data.rol).toBe('admin');
        });
    });

    it('Debe cambiar la contraseña del admin validando la anterior', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/usuarios/perfil/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          oldPassword: 'wrong-password',
          newPassword: 'NewSecurePassword123!',
        })
        .expect(401);

      await request(app.getHttpServer())
        .patch('/api/v1/usuarios/perfil/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          oldPassword: '123456',
          newPassword: 'NewSecurePassword123!',
        })
        .expect(200);

      await request(app.getHttpServer())
        .patch('/api/v1/usuarios/perfil/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          oldPassword: 'NewSecurePassword123!',
          newPassword: '123456',
        })
        .expect(200);
    });
  });

  describe('Gestión de Usuarios (Admin)', () => {
    it('Debe listar usuarios solo si es admin', async () => {
      await request(app.getHttpServer()).get('/api/v1/usuarios').expect(401);

      await request(app.getHttpServer())
        .get('/api/v1/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('Debe validar UUIDs incorrectos con 400', () => {
      return request(app.getHttpServer())
        .get('/api/v1/usuarios/no-es-un-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });
});
