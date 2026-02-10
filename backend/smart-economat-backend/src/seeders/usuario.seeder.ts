import { DataSource } from 'typeorm';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import {
  ROLES_DISPONIBLES,
  rolUsuario,
} from '../modules/usuario/enums/usuario.enums';

const NUM_USUARIOS_A_CREAR = 50;

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const usuarioRepo = dataSource.getRepository(Usuario);

  const usuarios: Usuario[] = [];
  for (let i = 0; i < NUM_USUARIOS_A_CREAR; i++) {
    const usuario = usuarioRepo.create({
      nombre: faker.person.fullName(),
      username: faker.internet.username(),
      password: faker.internet.password(),
      email: faker.internet.email(),
      rol: faker.helpers.arrayElement(ROLES_DISPONIBLES) as rolUsuario,
      cial_profesor: `CIAL_${i}${faker.string.numeric(4)}`,
      numero_clase: faker.string.numeric(2),
      aula:
        faker.string.fromCharacters(['A', 'B', 'C']) + faker.string.numeric(1),
      activo: faker.datatype.boolean(0.8),
    });
    usuarios.push(usuario);
  }

  await usuarioRepo.save(usuarios);
  console.log('Seeder de usuarios ejecutado correctamente.');
};
