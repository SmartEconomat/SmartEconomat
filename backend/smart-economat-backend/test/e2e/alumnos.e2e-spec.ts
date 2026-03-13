import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserStatus } from '../../src/modules/usuario/enums/usuario.enums';

describe('AlumnoController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let profesorToken: string;
  let profesorCial: string;

  beforeAll(async () => {
    app = await getTestApp();

    const adminResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    expect(adminResponse.status).toBe(200);
    adminToken = adminResponse.body.data.access_token;
  });

  beforeEach(async () => {
    const profUsername = `profe_e2e_${Date.now()}`;
    profesorCial = `CIAL_PROF_${Date.now()}`;
    const profCreateRes = await request(app.getHttpServer() as string)
      .post('/api/v1/admin/profesores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: profUsername,
        password: 'Password123!',
        email: `${profUsername}@example.com`,
        cial: profesorCial,
      });

    expect(profCreateRes.status).toBe(201);
    const profUserId = profCreateRes.body.data.user_id;
    await request(app.getHttpServer() as string)
      .patch(`/api/v1/admin/users/${profUserId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const profLoginRes = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: `${profUsername}@example.com`,
        password: 'Password123!',
      });
    expect(profLoginRes.status).toBe(200);
    profesorToken = profLoginRes.body.data.access_token;
  });

  describe('Registro de Alumnos (POST /alumnos/register)', () => {
    it('Debe registrar un nuevo alumno vinculado al profesor', async () => {
      const username = `alumno_${Date.now()}`;
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/alumnos/register')
        .send({
          username,
          password: 'Password123!',
          aula: 'Aula A',
          numeroClase: 1,
          cialProfesor: profesorCial,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.username).toBe(username);
      expect(response.body.data.status).toBe(UserStatus.INACTIVE);
    });

    it('Debe fallar si el CIAL del profesor no existe', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/alumnos/register')
        .send({
          username: `alumno_err_${Date.now()}`,
          password: 'Password123!',
          aula: 'Aula A',
          numeroClase: 2,
          cialProfesor: 'CIAL_NO_EXISTE',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('Gestión de Alumnos por Profesor', () => {
    let alumnoId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/alumnos/register')
        .send({
          username: `alumno_gest_${Date.now()}`,
          password: 'Password123!',
          aula: 'Aula A',
          numeroClase: 10,
          cialProfesor: profesorCial,
        });
      expect(res.status).toBe(201);
      alumnoId = res.body.data.id;
    });

    it('GET /profesores/alumnos - El profesor debe ver sus alumnos', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/profesores/alumnos')
        .set('Authorization', `Bearer ${profesorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.some((a: any) => a.id === alumnoId)).toBe(true);
    });

    it('PATCH /profesores/alumnos/:id/activate - El profesor activa a su alumno', async () => {
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/profesores/alumnos/${alumnoId}/activate`)
        .set('Authorization', `Bearer ${profesorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(UserStatus.ACTIVE);
    });

    it('POST /profesores/alumnos/:id/force-reset - El profesor resetea el pass de su alumno', async () => {
      const response = await request(app.getHttpServer() as string)
        .post(`/api/v1/profesores/alumnos/${alumnoId}/force-reset`)
        .set('Authorization', `Bearer ${profesorToken}`);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('provisionalPassword');
    });
  });
});
