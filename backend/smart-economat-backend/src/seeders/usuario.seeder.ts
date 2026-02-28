import { DataSource } from 'typeorm';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { rolUsuario } from '../modules/usuario/enums/usuario.enums';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

const NUM_USUARIOS_A_CREAR = 50;

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const usuarioRepo = dataSource.getRepository(Usuario);

  const usuarios: Usuario[] = [];

  const adminExists = await usuarioRepo.findOne({
    where: { username: 'admin' },
  });

  if (!adminExists) {
    const adminDefault = usuarioRepo.create({
      nombre: 'Administrador Principal',
      username: 'admin',
      password: '123456',
      email: 'admin@smarteconomat.com',
      rol: rolUsuario.ADMINISTRADOR,
      activo: true,
    });
    usuarios.push(adminDefault);
  }

  for (let i = 0; i < NUM_USUARIOS_A_CREAR - 1; i++) {
    const randomUsername =
      faker.internet.username() + faker.string.alphanumeric(4);
    const usuario = usuarioRepo.create({
      nombre: faker.person.fullName(),
      username: randomUsername,
      password: faker.internet.password(),
      email: faker.internet.email(),
      rol: faker.helpers.arrayElement(Object.values(rolUsuario)) as rolUsuario,
      activo: faker.datatype.boolean(0.8),
      cialProfesor: `CIAL_${i}${faker.string.numeric(4)}`,
      numeroClase: faker.string.numeric(2),
      aula:
        faker.string.fromCharacters(['A', 'B', 'C']) + faker.string.numeric(1),
    });
    usuarios.push(usuario);
  }

  for (const user of usuarios) {
    try {
      await usuarioRepo.save(user);
    } catch (e: any) {
      if (e.code !== '23505') {
        throw e;
      }
    }
  }

  console.log(SeederI18nHelper.getSeederSuccess('usuarios'));
};
