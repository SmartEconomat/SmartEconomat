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
 * @file recetas.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Recetas.
 * Cubre el CRUD de recetas y sus validaciones.
 */
describe('RecetaController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let recetaId: string;

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

  describe('CRUD de Recetas', () => {
    /**
     * @test Debe crear una receta con todos los campos obligatorios.
     */
    it('POST /recetas - Debe crear una receta (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/recetas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: `Receta E2E ${Date.now()}`,
          instrucciones: 'Mezclar y cocinar.',
          tiempo: '20 min',
          dificultad: 'Media',
          tiempoPreparacion: '15 min',
          ingredientes: [],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      recetaId = res.body.data.id;
    });

    /**
     * @test Debe listar las recetas registradas.
     */
    it('GET /recetas - Debe listar recetas (200)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/recetas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    /**
     * @test Debe actualizar los datos de una receta.
     */
    it('PATCH /recetas/:id - Debe actualizar receta (200)', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/recetas/${recetaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Receta Modificada' })
        .expect(200);
    });

    /**
     * @test Debe eliminar una receta (solo admin).
     */
    it('DELETE /recetas/:id - Debe eliminar receta (204)', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/recetas/${recetaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    /**
     * @test Debe duplicar una receta.
     */
    it('POST /recetas/duplicate - Debe duplicar una receta (201)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/recetas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Receta Original',
          instrucciones: 'Instrucciones originales',
          tiempo: '10 min',
          dificultad: 'Fácil',
          tiempoPreparacion: '5 min',
          ingredientes: [],
        })
        .expect(201);

      const originalId = createRes.body.data.id;

      const duplicateRes = await request(app.getHttpServer())
        .post('/api/v1/recetas/duplicate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceId: originalId,
          newName: 'Receta Duplicada',
        })
        .expect(201);

      expect(duplicateRes.body.success).toBe(true);
      expect(duplicateRes.body.data.nombre).toBe('Receta Duplicada');
      const duplicatedId = duplicateRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/recetas/${originalId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .delete(`/api/v1/recetas/${duplicatedId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });
});
