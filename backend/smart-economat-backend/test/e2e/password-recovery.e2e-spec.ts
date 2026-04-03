import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { Server } from 'http';
import { getTestApp } from '../setup/test-app';
import { Usuario } from '../../src/modules/usuario/usuario.entity/usuario.entity';

describe('User Lifecycle & Password Recovery (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    dataSource = app.get(DataSource);

    const loginRes = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = loginRes.body.data.access_token;
  });

  describe('Registro de Alumnos', () => {
    it('Debe registrar un nuevo alumno vinculándolo a un profesor existente', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/alumnos/register')
        .send({
          username: `alumno_e2e_${Date.now()}`,
          password: 'Password123!',
          aula: 'Aula 101 - Informática',
          numeroClase: 1,
          cialProfesor: 'CIAL-11111',
        })
        .expect(201);
    });
  });

  describe('Recuperación de Password (Admin)', () => {
    it('Admin debe poder resetear password de cualquier usuario (Profesor)', async () => {
      const prof = await dataSource
        .getRepository(Usuario)
        .findOneBy({ username: 'profesor1' });

      await request(app.getHttpServer())
        .post(`/api/v1/admin/users/${prof?.id}/force-reset`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);
    });

    it('Admin debe poder generar OTP de recuperación para sí mismo', async () => {
      const email = 'admin@smarteconomat.com';
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email })
        .expect(200);

      const user = await dataSource
        .getRepository(Usuario)
        .createQueryBuilder('u')
        .where('u.email = :email', { email })
        .addSelect('u.resetPasswordOtp')
        .getOne();

      expect(user?.resetPasswordOtp).toBeDefined();
    });
  });

  describe('Seguridad', () => {
    it('Debe denegar acceso a rutas de admin sin token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/users/any-id/force-reset')
        .expect(401);
    });
  });
});
