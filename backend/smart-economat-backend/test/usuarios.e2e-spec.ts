import { Server } from 'http';
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
 * @file usuarios.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Usuarios.
 * Cubre la gestión de perfil, cambios de contraseña y administración de usuarios.
 */
describe('UsuarioController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let testUserId: string;

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

    const response = await request(app.getHttpServer() as Server)
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

  describe('Perfil (Auto-servicio)', () => {
    /**
     * @test Debe obtener la información del perfil del usuario logueado.
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
     * @test Debe actualizar los datos básicos del perfil.
     */
    it('PATCH /usuarios/perfil - Debe actualizar mi nombre (200)', async () => {
      await request(app.getHttpServer() as Server)
        .patch('/api/v1/usuarios/perfil')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Admin Master' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.nombre).toBe('Admin Master');
        });
    });

    /**
     * @test Debe validar la contraseña antigua antes de cambiarla por una nueva.
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
        .send({ oldPassword: '123456', newPassword: 'NewPassword123!' })
        .expect(200);

      await request(app.getHttpServer() as Server)
        .patch('/api/v1/usuarios/perfil/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ oldPassword: 'NewPassword123!', newPassword: '123456' })
        .expect(200);
    });
  });

  describe('Administración (Solo Admin)', () => {
    /**
     * @test Debe listar todos los usuarios del sistema.
     */
    it('GET /usuarios - Debe listar usuarios (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data.data)).toBe(true);
      const profileRes = await request(app.getHttpServer())
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
     * @test Debe obtener un usuario específico por su ID.
     */
    it('GET /usuarios/:id - Debe obtener un usuario (200)', async () => {
      if (!testUserId) return;
      await request(app.getHttpServer() as Server)
        .get(`/api/v1/usuarios/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    /**
     * @test Debe permitir activar/desactivar un usuario.
     */
    it('PATCH /usuarios/:id/activar - Debe cambiar estado activo (200)', async () => {
      if (!testUserId) return;
      await request(app.getHttpServer() as Server)
        .patch(`/api/v1/usuarios/${testUserId}/activar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ activo: true })
        .expect(200);
    });

    /**
     * @test Debe permitir cambiar el rol de un usuario.
     */
    it('PATCH /usuarios/:id/rol - Debe cambiar el rol (200)', async () => {
      if (!testUserId) return;
      await request(app.getHttpServer() as Server)
        .patch(`/api/v1/usuarios/${testUserId}/rol`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rol: 'profesor' })
        .expect(200);
    });

    /**
     * @test Debe rechazar IDs que no sean UUID válidos.
     */
    it('GET /usuarios/:id - Debe fallar con UUID inválido (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/usuarios/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });
});
