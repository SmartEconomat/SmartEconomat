import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { getTestApp } from '../setup/test-app';
import { Alumno } from '../../src/modules/alumno/alumno.entity/alumno.entity';
import { Profesor } from '../../src/modules/profesor/profesor.entity/profesor.entity';
import { Usuario } from '../../src/modules/usuario/usuario.entity/usuario.entity';
import { UserStatus } from '../../src/modules/usuario/enums/usuario.enums';

describe('Security Lifecycle (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let profesor1Token: string;

  const unique = (prefix: string) =>
    `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  beforeAll(async () => {
    app = await getTestApp();
    dataSource = app.get(DataSource);

    const [adminLogin, profesor1Login] = await Promise.all([
      request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      }),
      request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: 'profesor1@smarteconomat.com',
        password: 'SmartEconomat2026!',
      }),
    ]);

    adminToken = adminLogin.body.data.access_token;
    profesor1Token = profesor1Login.body.data.access_token;
  });

  afterAll(() => {
    /* app compartida, no cerrar */
  });

  it('mantiene al profesor registrado como INACTIVE hasta que un admin lo active', async () => {
    const username = unique('profesor_registro');
    const email = `${username}@example.com`;
    const password = 'Password123!';
    const cial = unique('CIAL');

    await request(app.getHttpServer())
      .post('/api/v1/profesores/register')
      .send({ username, email, password, cial })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(400);

    const profesorUser = await dataSource.getRepository(Usuario).findOne({
      where: { username },
    });

    expect(profesorUser?.status).toBe(UserStatus.INACTIVE);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${profesorUser?.id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200)
      .expect((response) => {
        expect(response.body.data).toHaveProperty('access_token');
      });
  });

  it('impide el login de usuarios bloqueados', async () => {
    const username = unique('blocked_user');
    const email = `${username}@example.com`;
    const password = 'Password123!';

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ username, email, password })
      .expect(201);

    const usuarioRepo = dataSource.getRepository(Usuario);
    const user = await usuarioRepo.findOne({ where: { username } });

    if (!user) {
      throw new Error('No se pudo recuperar el usuario bloqueado de prueba');
    }

    user.status = UserStatus.BLOCKED;
    await usuarioRepo.save(user);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(400);
  });

  it('permite al alumno cambiar de profesor y actualiza los límites de gestión', async () => {
    const profesor2Username = unique('profesor_destino');
    const profesor2Email = `${profesor2Username}@example.com`;
    const profesor2Password = 'Password123!';
    const profesor2Cial = unique('CIAL_DEST');

    const createProfesor2 = await request(app.getHttpServer())
      .post('/api/v1/admin/profesores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: profesor2Username,
        email: profesor2Email,
        password: profesor2Password,
        cial: profesor2Cial,
      })
      .expect(201);

    const profesor2UserId = createProfesor2.body.data.user_id;

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${profesor2UserId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const profesor2Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: profesor2Email,
        password: profesor2Password,
      })
      .expect(200);

    const profesor2Token = profesor2Login.body.data.access_token;
    const nuevaAula = unique('AulaDestino');
    const nuevoNumeroClase = Math.floor(Math.random() * 1000) + 1;

    await request(app.getHttpServer())
      .post('/api/v1/profesores/slots')
      .set('Authorization', `Bearer ${profesor2Token}`)
      .send({
        aula: nuevaAula,
        numeroClase: nuevoNumeroClase,
      })
      .expect(201);

    const alumnoUsername = unique('alumno_transferencia');
    const alumnoPassword = 'Password123!';
    const aulaInicial = unique('AulaOrigen');
    const numeroClaseInicial = Math.floor(Math.random() * 1000) + 1;

    const registerAlumno = await request(app.getHttpServer())
      .post('/api/v1/alumnos/register')
      .send({
        username: alumnoUsername,
        password: alumnoPassword,
        aula: aulaInicial,
        numeroClase: numeroClaseInicial,
        cialProfesor: 'CIAL-11111',
      })
      .expect(201);

    const alumnoId = registerAlumno.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/profesores/alumnos/${alumnoId}/activate`)
      .set('Authorization', `Bearer ${profesor1Token}`)
      .expect(200);

    const alumnoLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: alumnoUsername,
        password: alumnoPassword,
      })
      .expect(200);

    const alumnoToken = alumnoLogin.body.data.access_token;

    await request(app.getHttpServer())
      .patch('/api/v1/alumnos/change-profesor')
      .set('Authorization', `Bearer ${alumnoToken}`)
      .send({
        cialNuevoProfesor: profesor2Cial,
        nuevaAula,
        nuevoNumeroClase,
      })
      .expect(200);

    const alumno = await dataSource.getRepository(Alumno).findOne({
      where: { id: alumnoId },
      relations: ['slot', 'slot.profesor', 'slot.profesor.user'],
    });
    const profesorDestino = await dataSource.getRepository(Profesor).findOne({
      where: { cial: profesor2Cial },
      relations: ['user'],
    });

    expect(alumno?.slot.profesor.id).toBe(profesorDestino?.id);

    await request(app.getHttpServer())
      .post(`/api/v1/profesores/alumnos/${alumnoId}/force-reset`)
      .set('Authorization', `Bearer ${profesor1Token}`)
      .expect(404);

    await request(app.getHttpServer())
      .post(`/api/v1/profesores/alumnos/${alumnoId}/force-reset`)
      .set('Authorization', `Bearer ${profesor2Token}`)
      .expect(201)
      .expect((response) => {
        expect(response.body.data).toHaveProperty('provisionalPassword');
      });
  });
});
