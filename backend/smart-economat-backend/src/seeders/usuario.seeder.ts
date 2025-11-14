import { DataSource } from 'typeorm';
/* import { v4 as uuidv4 } from 'uuid'; */
import { Usuario } from 'src/modules/usuario/usuario.entity/usuario.entity';
import {
  rolUsuario,
  ROLES_DISPONIBLES,
} from 'src/modules/usuario/enums/usuario.enums';

//CANTIDAD DE USUARIOS A CREAR
const NUM_USUARIOS_A_CREAR = 10;

//PREPARACIÓN DE CONSTANTES PARA LA ENTIDAD USUARIO
export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  const usuarioRepo = dataSource.getRepository(Usuario);
  const usuariosAGuardar: Usuario[] = [];

  for (let i = 0; i < NUM_USUARIOS_A_CREAR; i++) {
    const nombre = faker.person.firstName();
    const username = faker.internet.username();
    const password = faker.internet.password();
    const rolAleatorio = faker.helpers.arrayElement(
      ROLES_DISPONIBLES
    ) as rolUsuario;
    const email = faker.internet.email();
    const estadoActivo: boolean = faker.datatype.boolean();
    const nuevoUsuario = usuarioRepo.create({
      nombre: nombre,
      username: username,
      password: password,
      rol: rolAleatorio,
      email: email,
      activo: estadoActivo,
    });
    usuariosAGuardar.push(nuevoUsuario);
  }
  await usuarioRepo.save(usuariosAGuardar);
};
