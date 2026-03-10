import { getTestApp } from './test-app.helper';
import {
  INestApplication,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AlumnoController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await getTestApp();
  });

  afterAll(() => { /* app compartida, no cerrar */ });

  describe('Registro de Alumnos', () => {
    it('POST /alumnos/register - Debe fallar sin datos (400)', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/alumnos/register')
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
