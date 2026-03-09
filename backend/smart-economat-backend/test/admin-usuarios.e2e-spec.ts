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
import { DataSource } from 'typeorm';
import { Usuario } from '../src/modules/usuario/usuario.entity/usuario.entity';
import { rolUsuario } from '../src/modules/usuario/enums/usuario.enums';

describe('Admin User Management (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let alumnoToken: string;
  let dataSource: DataSource;

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

    const loginRes = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = loginRes.body.data.access_token;

    const teacherUsername = `teacher_${Date.now()}`;
    await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/register')
      .send({
        username: teacherUsername,
        email: `${teacherUsername}@test.com`,
        password: 'Password123!',
      });

    const usuarioRepo = dataSource.getRepository(Usuario);
    const teacher = await usuarioRepo.findOneBy({ username: teacherUsername });
    if (teacher) {
      teacher.rol = rolUsuario.PROFESOR;
      teacher.status = 'ACTIVE' as any;
      await usuarioRepo.save(teacher);
    }

    const teacherLogin = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/login')
      .send({
        email: `${teacherUsername}@test.com`,
        password: 'Password123!',
      });
    alumnoToken = teacherLogin.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Management Endpoints', () => {
    it('POST /usuarios/admin - Debe permitir a un ADMIN crear un PROFESOR (201)', async () => {
      const username = `prof_${Date.now()}`;
      const res = await request(app.getHttpServer() as Server)
        .post('/api/v1/usuarios/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Profesor Test',
          username,
          password: 'Password123!',
          email: `${username}@test.com`,
          rol: 'PROFESOR',
          cial: 'CIAL-12345',
        })
        .expect(201);

      expect(res.body.data.nombre).toBe('Profesor Test');
      expect(res.body.data.rol).toBe('PROFESOR');
    });

    it('POST /usuarios/admin - Debe permitir a un ADMIN crear un ALUMNO con aula (201)', async () => {
      const username = `alum_${Date.now()}`;
      const res = await request(app.getHttpServer() as Server)
        .post('/api/v1/usuarios/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Alumno Test',
          username,
          password: 'Password123!',
          email: `${username}@test.com`,
          rol: 'ALUMNO',
          aula: '101',
        })
        .expect(201);

      expect(res.body.data.nombre).toBe('Alumno Test');
      expect(res.body.data.rol).toBe('ALUMNO');
    });

    it('PATCH /usuarios/:id/admin - Debe permitir a un ADMIN desactivar un usuario (200)', async () => {
      const username = `todeactivate_${Date.now()}`;
      const createRes = await request(app.getHttpServer() as Server)
        .post('/api/v1/usuarios/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'To Deactivate',
          username,
          password: 'Password123!',
          rol: 'ALUMNO',
        });

      const userId = createRes.body.data.id;

      const res = await request(app.getHttpServer() as Server)
        .patch(`/api/v1/usuarios/${userId}/admin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          activo: false,
        })
        .expect(200);

      expect(res.body.data.activo).toBe(false);
    });

    it('POST /usuarios/admin - Debe denegar acceso a un NO-ADMIN (403)', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/usuarios/admin')
        .set('Authorization', `Bearer ${alumnoToken}`)
        .send({
          nombre: 'Unauthorized',
          username: 'unauth',
          password: 'Password123!',
          rol: 'ALUMNO',
        })
        .expect(403);
    });
  });
});
