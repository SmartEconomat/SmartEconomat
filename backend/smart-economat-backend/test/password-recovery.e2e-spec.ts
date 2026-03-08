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

    dataSource = app.get(DataSource);

    const response = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = response.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
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

    it('Debe permitir el registro de un Alumno (sin email)', async () => {
      await request(app.getHttpServer() as string)
        .post('/api/v1/alumnos/register')
        .send(alumnoData)
        .expect(201);

      const user = await dataSource
        .getRepository(Usuario)
        .findOne({ where: { username: alumnoData.username } });
      expect(user?.status).toBe(UserStatus.INACTIVE);
      expect(user?.rol).toBe(rolUsuario.ALUMNO);
    });

    it('No debe permitir login de Alumno inactivo', async () => {
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({ email: alumnoData.username, password: alumnoData.password })
        .expect(400);
    });

    it('Profesor debe poder activar a su Alumno', async () => {
      const profLogin = await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({
          email: 'profesor1@smarteconomat.com',
          password: 'SmartEconomat2026!',
        });
      const profToken = profLogin.body.data.access_token;

      const AlumnoRepo = dataSource.getRepository(Alumno);
      const user = await dataSource
        .getRepository(Usuario)
        .findOne({ where: { username: alumnoData.username } });
      const alumno = await AlumnoRepo.findOne({
        where: { user: { id: user?.id } },
      });
      alumnoId = alumno?.id || '';

      await request(app.getHttpServer() as string)
        .patch(`/api/v1/profesores/alumnos/${alumnoId}/activate`)
        .set('Authorization', `Bearer ${profToken}`)
        .expect(200);

      const updatedUser = await dataSource
        .getRepository(Usuario)
        .findOne({ where: { id: user?.id } });
      expect(updatedUser?.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('Flow: Password Recovery (Email)', () => {
    it('Admin (con email) debe recibir token de recuperación', async () => {
      await request(app.getHttpServer() as string)
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
      await request(app.getHttpServer() as string)
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
    let alumnoUserId: string;

    it('Profesor debe poder resetear password de Alumno (sin email)', async () => {
      const profLogin = await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({
          email: 'profesor1@smarteconomat.com',
          password: 'SmartEconomat2026!',
        });
      const profToken = profLogin.body.data.access_token;

      const AlumnoRepo = dataSource.getRepository(Alumno);
      const alu = await AlumnoRepo.findOne({
        where: { slot: { aula: 'Aula E2E' } },
        relations: ['user'],
      });
      alumnoUserId = alu?.user?.id || '';

      const res = await request(app.getHttpServer() as string)
        .post(`/api/v1/profesores/alumnos/${alu?.id}/force-reset`)
        .set('Authorization', `Bearer ${profToken}`)
        .expect(201);

      expect(res.body.data).toHaveProperty('provisionalPassword');
      provisionalPass = res.body.data.provisionalPassword;
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

    it('Alumno debe cambiar contraseña provisional al loguearse', async () => {
      const aluUser = await dataSource.getRepository(Usuario).findOne({
        where: { id: alumnoUserId || '00000000-0000-0000-0000-000000000000' },
      });

      const loginRes = await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({ email: aluUser?.username, password: provisionalPass })
        .expect(200);

      expect(loginRes.body.data.requirePasswordChange).toBe(true);
      const tempToken = loginRes.body.data.access_token;

      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({
          currentPassword: provisionalPass,
          newPassword: 'FinalSecurePass123!',
        })
        .expect(200);

      const finalLogin = await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({ email: aluUser?.username, password: 'FinalSecurePass123!' })
        .expect(200);

      expect(finalLogin.body.data.requirePasswordChange).toBe(false);
    });
  });

  describe('Security Boundaries (Isolation Tests)', () => {
    let prof2Token: string;
    let foreignAlumnoId: string;

    beforeAll(async () => {
      const userRepo = dataSource.getRepository(Usuario);
      const hashedPass = await bcrypt.hash('SmartEconomat2026!', 10);

      const prof2User = await userRepo.save(
        userRepo.create({
          username: 'prof_boundary_test',
          password: hashedPass,
          rol: rolUsuario.PROFESOR,
          status: UserStatus.ACTIVE,
        })
      );

      const ProfRepo = dataSource.getRepository(Profesor);
      await ProfRepo.save(
        ProfRepo.create({
          user: prof2User,
          cial: 'CIAL-BOUNDARY',
        })
      );

      const prof2Login = await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({ email: prof2User.username, password: 'SmartEconomat2026!' });
      prof2Token = prof2Login.body.data.access_token;

      const AlumnoRepo = dataSource.getRepository(Alumno);
      const alu = await AlumnoRepo.findOne({
        where: { slot: { aula: 'Aula E2E' } },
      });
      foreignAlumnoId = alu!.id;
    });

    it('Profesor NO puede activar un alumno de otro profesor', async () => {
      await request(app.getHttpServer() as string)
        .patch(`/api/v1/profesores/alumnos/${foreignAlumnoId}/activate`)
        .set('Authorization', `Bearer ${prof2Token}`)
        .expect(404);
    });

    it('Profesor NO puede resetear password de un alumno ajeno', async () => {
      await request(app.getHttpServer() as string)
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
      await request(app.getHttpServer() as string)
        .post('/api/v1/alumnos/register')
        .send(aluData);

      const user = await dataSource
        .getRepository(Usuario)
        .findOne({ where: { username: aluData.username } });
      user!.status = UserStatus.ACTIVE;
      await dataSource.getRepository(Usuario).save(user!);

      const aluLogin = await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({ email: aluData.username, password: aluData.password });
      const aluToken = aluLogin.body.data.access_token;

      await request(app.getHttpServer() as string)
        .post(`/api/v1/admin/users/${user?.id}/force-reset`)
        .set('Authorization', `Bearer ${aluToken}`)
        .expect(403);
    });
  });
});
