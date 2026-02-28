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
 * @file proveedores.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Proveedores.
 * Cubre el ciclo de vida completo (CRUD) de un proveedor.
 */
describe('ProveedorController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let proveedorId: string;

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

  describe('CRUD de Proveedores', () => {
    /**
     * @test Debe crear un nuevo proveedor.
     */
    it('POST /proveedor - Debe crear un proveedor (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: `Proveedor E2E ${Date.now()}`,
          cif: 'B99999999',
          email: 'e2e@proveedor.com',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      proveedorId = res.body.data.id;
    });

    /**
     * @test Debe listar proveedores.
     */
    it('GET /proveedor - Debe listar proveedores (200)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data.data)).toBe(true);
        });
    });

    /**
     * @test Debe actualizar un proveedor.
     */
    it('PATCH /proveedor/:id - Debe actualizar proveedor (200)', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/proveedor/${proveedorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Proveedor Modificado' })
        .expect(200);
    });

    /**
     * @test Debe eliminar un proveedor (admin).
     */
    it('DELETE /proveedor/:id - Debe eliminar proveedor (204)', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/proveedor/${proveedorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });
});
