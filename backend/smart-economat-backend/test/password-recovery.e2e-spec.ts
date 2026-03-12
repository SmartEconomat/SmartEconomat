import { getTestApp } from './test-app.helper';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { DataSource } from 'typeorm';
import { Usuario } from '../src/modules/usuario/usuario.entity/usuario.entity';
import {
  rolUsuario,
  UserStatus,
} from '../src/modules/usuario/enums/usuario.enums';
import * as bcrypt from 'bcrypt';
import { Alumno } from '../src/modules/alumno/alumno.entity/alumno.entity';
import { Profesor } from '../src/modules/profesor/profesor.entity/profesor.entity';

describe('User Lifecycle & Password Recovery (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();

    dataSource = app.get(DataSource);

    const response = await request(app.getHttpServer())
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

  describe('Flow: Alumno Registration & Activation', () => {
    const alumnoData = {
      username: `alumno_e2e_${Date.now()}`,
      password: 'Password123!',
      aula: 'Aula E2E',
      numeroClase: 101,
      cialProfesor: 'CIAL-11111',
    };
    let alumnoId: string;

    it('Debe completar el flujo de registro y activación de un Alumno', async () => {
      // 1. Registro
      await request(app.getHttpServer() as string)
        .post('/api/v1/alumnos/register')
        .send(alumnoData)
        .expect(201);

      const userRes = await dataSource
        .getRepository(Usuario)
        .findOne({ where: { username: alumnoData.username } });
      expect(userRes?.status).toBe(UserStatus.INACTIVE);

      // 2. Login denegado
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({ email: alumnoData.username, password: alumnoData.password })
        .expect(400);

      // 3. Activación por profesor
      const profLogin = await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({
          email: 'profesor1@smarteconomat.com',
          password: 'SmartEconomat2026!',
        });
      const profToken = profLogin.body.data.access_token;

      const user = await dataSource
        .getRepository(Usuario)
        .findOne({ where: { username: alumnoData.username } });

      const AlumnoRepo = dataSource.getRepository(Alumno);
      const alumno = await AlumnoRepo.findOne({
        where: { user: { id: user?.id } },
      });
      alumnoId = alumno?.id || '';

      await request(app.getHttpServer())
        .patch(`/api/v1/profesores/alumnos/${alumnoId}/activate`)
        .set('Authorization', `Bearer ${profToken}`)
        .expect(200);

      // 4. Verificación
      const updatedUser = await dataSource
        .getRepository(Usuario)
        .findOne({ where: { id: user?.id } });
      expect(updatedUser?.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('Flow: Password Recovery (Email)', () => {
    it('Admin (con email) debe recibir token de recuperación', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'admin@smarteconomat.com' })
        .expect(200);

      const user = await dataSource.getRepository(Usuario).findOne({
        where: { email: 'admin@smarteconomat.com' },
        select: ['passwordResetToken'],
      });
      expect(user?.passwordResetToken).toBeDefined();
    });

    it('Profesor (con email) debe recibir token de recuperación', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'profesor1@smarteconomat.com' })
        .expect(200);

      const user = await dataSource.getRepository(Usuario).findOne({
        where: { email: 'profesor1@smarteconomat.com' },
        select: ['passwordResetToken'],
      });
      expect(user?.passwordResetToken).toBeDefined();
    });
  });

  describe('Flow: Force Password Reset (Temporal Password)', () => {
    let provisionalPass: string;

    it('Debe completar el flujo de reseteo forzado y cambio de contraseña', async () => {
      // 1. Reset forzado por profesor
      const profLogin = await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({
          email: 'profesor1@smarteconomat.com',
          password: 'SmartEconomat2026!',
        });
      const profToken = profLogin.body.data.access_token;

      // Buscar un alumno real (de los seeders) que pertenezca a profesor1 y esté activo
      const AlumnoRepo = dataSource.getRepository(Alumno);
      const alu = await AlumnoRepo.findOne({
        where: {
          slot: {
            profesor: { user: { email: 'profesor1@smarteconomat.com' } },
          },
          user: { status: UserStatus.ACTIVE },
        },
        relations: ['user', 'slot', 'slot.profesor'],
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/profesores/alumnos/${alu?.id}/force-reset`)
        .set('Authorization', `Bearer ${profToken}`)
        .expect(201);

      expect(res.body.data).toHaveProperty('provisionalPassword');
      provisionalPass = res.body.data.provisionalPassword;

      // 2. Cambio obligatorio al loguearse
      const aluUser = alu?.user;
      const loginRes = await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({ email: aluUser?.username, password: provisionalPass })
        .expect(200);

      expect(loginRes.body.data.requirePasswordChange).toBe(true);
      const tempToken = loginRes.body.data.access_token;

      await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({
          currentPassword: provisionalPass,
          newPassword: 'FinalSecurePass123!',
        })
        .expect(200);

      const finalLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: aluUser?.username, password: 'FinalSecurePass123!' })
        .expect(200);

      expect(finalLogin.body.data.requirePasswordChange).toBe(false);
    });

    it('Admin debe poder resetear password de Profesor (con email opcional)', async () => {
      const profUser = await dataSource
        .getRepository(Usuario)
        .findOne({ where: { username: 'profesor2' } });

      const res = await request(app.getHttpServer() as string)
        .post(`/api/v1/admin/users/${profUser?.id}/force-reset`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(res.body.data).toHaveProperty('provisionalPassword');
    });
  });

  describe('Security Boundaries (Isolation Tests)', () => {
    let prof2Token: string;
    let foreignAlumnoId: string;

    beforeEach(async () => {
      const userRepo = dataSource.getRepository(Usuario);
      const hashedPass = await bcrypt.hash('SmartEconomat2026!', 10);

      const prof2User = await userRepo.save(
        userRepo.create({
          username: `prof_bound_${Date.now()}_${Math.random()}`,
          password: hashedPass,
          rol: rolUsuario.PROFESOR,
          status: UserStatus.ACTIVE,
        })
      );

      const ProfRepo = dataSource.getRepository(Profesor);
      await ProfRepo.save(
        ProfRepo.create({
          user: prof2User,
          cial: `CIAL-${Date.now()}`,
        })
      );

      const prof2Login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: prof2User.username, password: 'SmartEconomat2026!' });
      prof2Token = prof2Login.body.data.access_token;
      const AlumnoRepo = dataSource.getRepository(Alumno);

      // Registrar un alumno "ajeno" que pertenecerá al profesor1 (puesto por defecto en el registro)
      const foreignAlumnoData = {
        username: `foreign_alu_${Date.now()}_${Math.random()}`,
        password: 'Password123!',
        aula: 'Aula Foreign',
        numeroClase: 200,
        cialProfesor: 'CIAL-11111', // CIAL de profesor1
      };

      await request(app.getHttpServer() as string)
        .post('/api/v1/alumnos/register')
        .send(foreignAlumnoData)
        .expect(201);

      const foreignUser = await dataSource
        .getRepository(Usuario)
        .findOne({ where: { username: foreignAlumnoData.username } });
      const alu = await AlumnoRepo.findOne({
        where: { user: { id: foreignUser?.id } },
      });
      foreignAlumnoId = alu!.id;
    });

    it('Profesor NO puede activar un alumno de otro profesor', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/profesores/alumnos/${foreignAlumnoId}/activate`)
        .set('Authorization', `Bearer ${prof2Token}`)
        .expect(404);
    });

    it('Profesor NO puede resetear password de un alumno ajeno', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/profesores/alumnos/${foreignAlumnoId}/force-reset`)
        .set('Authorization', `Bearer ${prof2Token}`)
        .expect(404);
    });

    it('Alumno NO puede acceder a endpoints de Admin', async () => {
      const aluData = {
        username: 'alumno_security_test',
        password: 'Password123!',
        aula: 'Security',
        numeroClase: 202,
        cialProfesor: 'CIAL-11111',
      };
      await request(app.getHttpServer())
        .post('/api/v1/alumnos/register')
        .send(aluData);

      const user = await dataSource
        .getRepository(Usuario)
        .findOne({ where: { username: aluData.username } });
      user!.status = UserStatus.ACTIVE;
      await dataSource.getRepository(Usuario).save(user!);

      const aluLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: aluData.username, password: aluData.password });
      const aluToken = aluLogin.body.data.access_token;

      await request(app.getHttpServer())
        .post(`/api/v1/admin/users/${user?.id}/force-reset`)
        .set('Authorization', `Bearer ${aluToken}`)
        .expect(403);
    });
  });
});
