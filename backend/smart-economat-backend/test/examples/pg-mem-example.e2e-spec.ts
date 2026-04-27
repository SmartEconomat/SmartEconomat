import { INestApplication } from '@nestjs/common';
import { getTestApp } from '../setup/test-app';
import { DataSource } from 'typeorm';
import { Usuario } from '../../src/modules/usuario/usuario.entity/usuario.entity';
import { rolUsuario } from '../../src/modules/usuario/enums/usuario.enums';

/**
 * Documentación en español.
 */
describe('Ejemplo pg-mem (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await getTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(() => {
    /* app compartida globalmente, se limpia al final de todo el proceso en globalTeardown.ts */
  });

  /**
   * Documentación en español.
   */
  it('Test 1 - Debe insertar un usuario temporal', async () => {
    const usuarioRepo = dataSource.getRepository(Usuario);

    const initialCount = await usuarioRepo.count();

    const nuevoUsuario = usuarioRepo.create({
      email: 'test_temporal_1@example.com',
      password: 'Password123!',
      username: 'temporal',
      rol: rolUsuario.ALUMNO,
      status: 'ACTIVE',
    } as any);

    await usuarioRepo.save(nuevoUsuario);

    const newCount = await usuarioRepo.count();
    expect(newCount).toBe(initialCount + 1);

    const userInDb = await usuarioRepo.findOne({
      where: { email: 'test_temporal_1@example.com' },
    });
    expect(userInDb).toBeDefined();
    expect(userInDb?.username).toBe('temporal');

    console.log('Test 1 completado. Usuario insertado en memoria.');
  });

  /**
   * Documentación en español.
   */
  it('Test 2 - Debe verificar que el estado se reseteó automáticamente (snapshot restore)', async () => {
    const usuarioRepo = dataSource.getRepository(Usuario);

    const userInDb = await usuarioRepo.findOne({
      where: { email: 'test_temporal_1@example.com' },
    });

    expect(userInDb).toBeNull();
    console.log(
      'Test 2 completado. El snapshot fue restaurado correctamente (usuario temporal no existe).'
    );
  });
});
