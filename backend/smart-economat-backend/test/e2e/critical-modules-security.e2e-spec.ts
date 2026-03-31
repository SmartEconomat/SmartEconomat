/**
 * Matriz mínima de seguridad en módulos críticos (401 sin token, 403 rol inadecuado, 400 payload inválido).
 * Complementa rbac.e2e-spec y casos dispersos en otros ficheros.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Usuario } from '../../src/modules/usuario/usuario.entity/usuario.entity';
import { rolUsuario } from '../../src/modules/usuario/enums/usuario.enums';
import { getTestApp } from '../setup/test-app';

describe('Critical modules — security matrix (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let alumnoToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = adminRes.body.data.access_token;

    const ds = app.get(DataSource);
    const alumnoUser = await ds.getRepository(Usuario).findOne({
      where: { rol: rolUsuario.ALUMNO },
      order: { createdAt: 'ASC' },
    });
    if (!alumnoUser?.email) {
      throw new Error(
        'Se requiere al menos un usuario ALUMNO sembrado para este test'
      );
    }
    const alumnoRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: alumnoUser.email,
        password: 'SmartEconomat2026!',
      });
    alumnoToken = alumnoRes.body.data.access_token;
  });

  describe('401 sin Authorization', () => {
    it('GET /api/v1/inventario', async () => {
      await request(app.getHttpServer()).get('/api/v1/inventario').expect(401);
    });
    it('GET /api/v1/pedidos', async () => {
      await request(app.getHttpServer()).get('/api/v1/pedidos').expect(401);
    });
    it('GET /api/v1/recepciones', async () => {
      await request(app.getHttpServer()).get('/api/v1/recepciones').expect(401);
    });
    it('GET /api/v1/usuarios (admin)', async () => {
      await request(app.getHttpServer()).get('/api/v1/usuarios').expect(401);
    });
  });

  describe('403 rol ALUMNO en rutas de administración', () => {
    it('GET /api/v1/usuarios con token alumno', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/usuarios')
        .set('Authorization', `Bearer ${alumnoToken}`)
        .expect(403);
    });
  });

  describe('400 cuerpo inválido (DTO)', () => {
    it('POST /api/v1/recepciones — body vacío', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
    it('POST /api/v1/auth/login — credenciales vacías', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);
    });
  });
});
