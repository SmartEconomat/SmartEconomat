import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { rolUsuario } from '../modules/usuario/enums/usuario.enums';
import { dbConfig } from '../config/database.config';

export const dataSource = new DataSource({
  ...dbConfig,
  synchronize: false,
});

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim();
  const password = (process.env.ADMIN_PASSWORD || '').trim();
  const username = (process.env.ADMIN_USERNAME || 'admin').trim() || 'admin';

  if (!email) {
    throw new Error('ADMIN_EMAIL es obligatorio para seed:admin');
  }

  if (!password) {
    throw new Error('ADMIN_PASSWORD es obligatorio para seed:admin');
  }

  await dataSource.initialize();
  const repo = dataSource.getRepository(Usuario);

  const existing = await repo.findOne({
    where: [{ username }, { email }],
  });

  if (existing) {
    existing.email = email;
    existing.username = username;
    existing.password = password;
    existing.rol = rolUsuario.ADMINISTRADOR;
    existing.activo = true;
    await repo.save(existing);
  } else {
    const admin = repo.create({
      nombre: 'Administrador del Sistema',
      username,
      password,
      email,
      rol: rolUsuario.ADMINISTRADOR,
      activo: true,
    });
    await repo.save(admin);
  }

  await dataSource.destroy();
}

if (require.main === module) {
  void main().catch(async (err) => {
    try {
      if (dataSource.isInitialized) await dataSource.destroy();
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
    console.error(err);
    process.exit(1);
  });
}
