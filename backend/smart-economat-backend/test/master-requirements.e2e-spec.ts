import { getTestApp } from './test-app.helper';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { DataSource } from 'typeorm';
import { Usuario } from '../src/modules/usuario/usuario.entity/usuario.entity';
import { Alumno } from '../src/modules/alumno/alumno.entity/alumno.entity';

describe('SmartEconomat Master E2E Suite', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let profToken: string;
  let alumnoId: string;
  let alumnoToken: string;
  let studentUsername: string;
  const SEED_PASS = 'SmartEconomat2026!';

  beforeEach(async () => {
    app = await getTestApp();
    dataSource = app.get(DataSource);

    const adminRes = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@smarteconomat.com', password: SEED_PASS })
      .expect(200);
    adminToken = adminRes.body.data.access_token;

    const profRes = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({ email: 'profesor1@smarteconomat.com', password: SEED_PASS })
      .expect(200);
    profToken = profRes.body.data.access_token;
  });

  describe('AUTH - Autenticación', () => {
    it('[AUTH-01/02/04/05] Flujo de login: credenciales correctas e incorrectas', async () => {
      // Correctos
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({ email: 'admin', password: SEED_PASS })
        .expect(200);
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({ email: 'profesor1', password: SEED_PASS })
        .expect(200);

      // Incorrectos
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({ email: 'admin', password: 'wrong' })
        .expect(400);
      await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent', password: SEED_PASS })
        .expect(400);
    });
  });

  describe('REG & ACT & TP - Ciclo Completo de Alumno', () => {
    it('[REG-ACT-TP] Registro, Activación, Login y Reseteo Forzado', async () => {
      studentUsername = `alu_master_${Date.now()}`;
      const regData = {
        username: studentUsername,
        password: 'Password123!',
        aula: 'Master A',
        numeroClase: 222,
        cialProfesor: 'CIAL-11111',
      };

      // 1. Registro
      await request(app.getHttpServer() as string)
        .post('/api/v1/alumnos/register')
        .send(regData)
        .expect(201);

      // 2. Activación
      const user = await dataSource
        .getRepository(Usuario)
        .findOne({ where: { username: studentUsername } });
      const alu = await dataSource
        .getRepository(Alumno)
        .findOne({ where: { user: { id: user?.id } } });
      alumnoId = alu!.id;

      await request(app.getHttpServer() as string)
        .patch(`/api/v1/profesores/alumnos/${alumnoId}/activate`)
        .set('Authorization', `Bearer ${profToken}`)
        .expect(200);

      const loginRes = await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({ email: studentUsername, password: 'Password123!' });
      alumnoToken = loginRes.body.data.access_token;

      // 3. Reseteo Forzado
      const forceRes = await request(app.getHttpServer() as string)
        .post(`/api/v1/profesores/alumnos/${alumnoId}/force-reset`)
        .set('Authorization', `Bearer ${profToken}`)
        .expect(201);

      const prov = forceRes.body.data.provisionalPassword;
      const loginProv = await request(app.getHttpServer() as string)
        .post('/api/v1/auth/login')
        .send({ email: studentUsername, password: prov })
        .expect(200);
      expect(loginProv.body.data.requirePasswordChange).toBe(true);

      // 4. Verificación de Seguridad (RBAC)
      await request(app.getHttpServer() as string)
        .post('/api/v1/admin/profesores')
        .set('Authorization', `Bearer ${alumnoToken}`)
        .expect(403);
    });
  });

  describe('AUTHZ & SEC - Seguridad y Administración', () => {
    it('[SEC-02] No leaking de password hash', async () => {
      const res = await request(app.getHttpServer() as string)
        .get('/api/v1/usuarios/perfil')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.data).not.toHaveProperty('password');
    });
  });

  describe('EDGE - Casos Límites', () => {
    it('[EDGE-04] Numero clase negativo rechazado', async () => {
      await request(app.getHttpServer() as string)
        .post('/api/v1/alumnos/register')
        .send({
          username: 'edge_neg',
          password: '123',
          aula: 'X',
          numeroClase: -1,
          cialProfesor: 'RIAL-11111',
        })
        .expect(400);
    });
  });
});
