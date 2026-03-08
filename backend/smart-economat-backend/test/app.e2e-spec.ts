import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

/**
 * @file app.e2e-spec.ts
 * @description Pruebas globales de la aplicación y el AppController.
 * Verifica la disponibilidad general del servicio.
 */
describe('AppController (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * @test Debe responder correctamente al endpoint raíz (Hello World).
   */
  it('/ (GET)', () => {
    return request(app.getHttpServer() as string)
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
