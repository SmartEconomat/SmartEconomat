import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreparacionModule } from '../../src/modules/preparacion/preparacion.module';
import { Producto } from '../../src/modules/producto/producto.entity/producto.entity';
import { PreparacionEntity } from '../../src/modules/preparacion/preparacion.entity';

describe('PreparacionController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [PreparacionEntity, Producto],
          synchronize: true,
        }),
        PreparacionModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/preparaciones (GET) debe devolver 200', () => {
    return request(app.getHttpServer()).get('/preparaciones').expect(200);
  });
});
