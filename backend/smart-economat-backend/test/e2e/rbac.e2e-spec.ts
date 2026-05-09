import { getTestApp } from '../setup/test-app';
import { Server } from 'http';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { DataSource } from 'typeorm';
import { Permiso } from '../../src/modules/permisos/permiso.entity/permiso.entity';
import { Usuario } from '../../src/modules/usuario/usuario.entity/usuario.entity';
import { UserStatus } from '../../src/modules/usuario/enums/usuario.enums';
import { Rol } from '../../src/modules/roles/rol.entity/rol.entity';

describe('RBAC System (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let alumnoToken: string;
  let alumnoId: string;
  let permisoListarUsuariosId: string;
  let permisoListarProductosId: string;
  let rolProfesorId: string;

  beforeAll(async () => {
    app = await getTestApp();

    dataSource = app.get(DataSource);

    const permisoRepo = dataSource.getRepository(Permiso);
    const pListarUsers = await permisoRepo.findOneBy({
      codigo: 'usuarios:listar',
    });
    const pListarProd = await permisoRepo.findOneBy({
      codigo: 'productos:listar',
    });

    if (!pListarUsers || !pListarProd) {
      throw new Error(
        'Required permissions not found in DB. Ensure seeder has run.'
      );
    }

    const roleRepo = dataSource.getRepository(Rol);
    const rolProfesor = await roleRepo.findOneBy({ nombre: 'PROFESOR' });
    if (!rolProfesor) {
      throw new Error('Role PROFESOR not found in DB. Ensure seeder has run.');
    }

    permisoListarUsuariosId = pListarUsers.id!;
    permisoListarProductosId = pListarProd.id!;
    rolProfesorId = rolProfesor.id!;

    const loginRes = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = loginRes.body.data.access_token;
  });

  beforeEach(async () => {
    const username = `alumno_rbac_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const email = `${username}@test.com`;
    const registerRes = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/register')
      .send({
        username,
        email,
        password: 'Password123!',
      });
    alumnoToken = registerRes.body.data.access_token;

    const usuarioRepo = dataSource.getRepository(Usuario);
    const usuario = await usuarioRepo.findOneBy({ username });
    if (!usuario) throw new Error('User not found after registration');

    usuario.status = UserStatus.ACTIVE;
    await usuarioRepo.save(usuario);
    alumnoId = usuario.id!;

    await request(app.getHttpServer() as Server)
      .patch(`/api/v1/usuarios/${alumnoId}/rol`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rol: 'ALUMNO' });
  });

  afterAll(() => {});

  describe('Acceso Base (ALUMNO)', () => {
    it('Debe permitir a un ALUMNO ver productos (Permiso por defecto)', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/productos')
        .set('Authorization', `Bearer ${alumnoToken}`)
        .expect(200);
    });

    it('Debe denegar a un ALUMNO listar usuarios (Sin permiso)', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/usuarios')
        .set('Authorization', `Bearer ${alumnoToken}`)
        .expect(403);
    });
  });

  describe('Overrides de Permisos', () => {
    it('Debe permitir listar usuarios tras añadir el permiso adicional', async () => {
      await request(app.getHttpServer() as Server)
        .post(
          `/api/v1/usuarios/${alumnoId}/permisos-adicionales/${permisoListarUsuariosId}`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      await request(app.getHttpServer() as Server)
        .get('/api/v1/usuarios')
        .set('Authorization', `Bearer ${alumnoToken}`)
        .expect(200);
    });

    it('Debe denegar listar productos tras excluir el permiso', async () => {
      await request(app.getHttpServer() as Server)
        .post(
          `/api/v1/usuarios/${alumnoId}/permisos-excluidos/${permisoListarProductosId}`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      await request(app.getHttpServer() as Server)
        .get('/api/v1/productos')
        .set('Authorization', `Bearer ${alumnoToken}`)
        .expect(403);
    });

    it('Debe restaurar el acceso tras quitar la exclusión de productos', async () => {
      await request(app.getHttpServer() as Server)
        .delete(
          `/api/v1/usuarios/${alumnoId}/permisos-excluidos/${permisoListarProductosId}`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer() as Server)
        .get('/api/v1/productos')
        .set('Authorization', `Bearer ${alumnoToken}`)
        .expect(200);
    });
  });

  describe('Vinculación/Desvinculación de Roles', () => {
    it('Debe asignar y quitar rol desde /roles/assign-user y /roles/:id/users/:usuarioId', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/roles/assign-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ usuarioId: alumnoId, rolId: rolProfesorId })
        .expect(201);

      const afterAssign = await request(app.getHttpServer() as Server)
        .get(`/api/v1/roles/users/${alumnoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(
        (afterAssign.body.data as Array<{ id: string }>).some(
          (rol) => rol.id === rolProfesorId
        )
      ).toBe(true);

      await request(app.getHttpServer() as Server)
        .delete(`/api/v1/roles/${rolProfesorId}/users/${alumnoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const afterRemove = await request(app.getHttpServer() as Server)
        .get(`/api/v1/roles/users/${alumnoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(
        (afterRemove.body.data as Array<{ id: string }>).some(
          (rol) => rol.id === rolProfesorId
        )
      ).toBe(false);
    });
  });
});
