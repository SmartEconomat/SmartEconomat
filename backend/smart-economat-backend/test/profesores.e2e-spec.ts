import { getTestApp } from './test-app.helper';
import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('ProfesorController (e2e)', () => {
  let app: INestApplication;
  let profesorToken: string;

  beforeAll(async () => {
    app = await getTestApp();

    const profResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'profesor1@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    profesorToken = (profResponse.body as { data: { access_token: string } })
      .data.access_token;
  });

  afterAll(() => {
    /* app compartida, no cerrar */
  });

  describe('Registro de Profesores', () => {
    it('POST /profesores/register - Debe registrar un nuevo profesor (201)', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/profesores/register')
        .send({
          username: 'profe_test',
          password: 'TestPassword123!',
          email: 'profe_test@example.com',
          cial: 'CIAL123456',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('Gestión de Slots (Admin/Profesor)', () => {
    it('POST /profesores/slots - Debe crear un slot para el profesor (201)', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/profesores/slots')
        .set('Authorization', `Bearer ${profesorToken}`)
        .send({
          aula: 'Aula de Test',
          numeroClase: 1,
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Gestión de Alumnos', () => {
    it('GET /profesores/alumnos - Debe listar los alumnos del profesor (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/profesores/alumnos')
        .set('Authorization', `Bearer ${profesorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
