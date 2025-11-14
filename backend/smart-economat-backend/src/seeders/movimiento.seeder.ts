import { DataSource } from 'typeorm';
/* import { v4 as uuidv4 } from 'uuid'; */
import { Movimiento } from 'src/modules/movimiento/movimiento.entity/movimiento.entity';
import {
  TIPOS_DISPONIBLES,
  TipoMovimiento,
} from 'src/modules/movimiento/enums/movimiento.enums';
import { Usuario } from 'src/modules/usuario/usuario.entity/usuario.entity';

//1. CANTIDAD DE USUARIOS A CREAR
const NUM_MOVIMIENTOS_A_CREAR = 50;

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  const movimientoRepo = dataSource.getRepository(Movimiento);
  const usuarioRepo = dataSource.getRepository(Usuario);

  // OBTENER USUARIOS EXISTENTES
  const usuarios = await usuarioRepo.find();

  if (usuarios.length === 0) {
    console.warn(
      'Advertencia: No hay usuarios. El seeder de Movimiento requiere que el seeder de Usuario se ejecute primero.'
    );
    return;
  }

  const movimientoAGuardar: Movimiento[] = [];

  // 2. GENERAR MOVIMIENTOS
  for (let i = 0; i < NUM_MOVIMIENTOS_A_CREAR; i++) {
    const tipoAleatorio = faker.helpers.arrayElement(
      TIPOS_DISPONIBLES
    ) as TipoMovimiento;
    const cantidad = faker.number.int({ min: 1, max: 100 });
    const descripcion = faker.lorem.sentences(2);
    const fechaReciente = faker.date.recent({ days: 10 });
    const usuarioAleatorio = faker.helpers.arrayElement(usuarios);
    const inventarioUUID = faker.string.uuid();
    // 3. CREAR LA ENTIDAD
    const nuevoMovimiento = movimientoRepo.create({
      tipo: tipoAleatorio,
      cantidad: cantidad,
      descripcion: descripcion,
      fecha: fechaReciente,
      usuario: usuarioAleatorio, // Objeto de entidad Usuario completo
      inventario: inventarioUUID, // String UUID
    });

    movimientoAGuardar.push(nuevoMovimiento);
  }
  await movimientoRepo.save(movimientoAGuardar);
  /* console.log(`Se insertaron ${NUM_MOVIMIENTOS_A_CREAR} Movimientos.`); */
};
