import 'reflect-metadata';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { Movimiento } from '../modules/movimiento/movimiento.entity/movimiento.entity';
import { TipoMovimiento } from '../modules/movimiento/enums/movimiento.enums';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { rolUsuario, UserStatus } from '../modules/usuario/enums/usuario.enums';
import { Inventario } from '../modules/inventario/inventario.entity/inventario.entity';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { Proveedor } from '../modules/proveedor/proveedor.entity/proveedor.entity';
import { ProductoAlergeno } from '../modules/producto/producto-alergeno.entity/producto-alergeno.entity';
import { Ubicacion } from '../modules/ubicacion/ubicacion.entity/ubicacion.entity';
import {
  UnidadMedida,
  TipoProducto,
  Alergeno,
} from '../modules/producto/enums/producto.enums';
import { dbConfig } from '../config/database.config';
import * as crypto from 'crypto';

dotenv.config({ path: join(__dirname, '../../../../.env') });

const dataSource = new DataSource({
  ...dbConfig,
  entities: [join(__dirname, '../**/*.entity.{ts,js}')],
  logging: false,
});

/**
 * Inserta datos en lotes pequeños para evitar el límite de parámetros de Postgres.
 */
async function batchInsert<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  values: any[],
  batchSize = 500
) {
  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(entity)
      .values(batch)
      .orIgnore()
      .execute();
  }
}

async function runMegaMassiveSeeder() {
  await dataSource.initialize();
  console.log('🚀 Iniciando Inserción MEGA-MASIVA (Múltiples Entidades)...');

  const startTime = Date.now();

  const numUsuarios = 1000;
  console.log(`👤 Generando ${numUsuarios} usuarios...`);
  const usuarios: any[] = [];
  for (let i = 0; i < numUsuarios; i++) {
    usuarios.push({
      id: crypto.randomUUID(),
      nombre: `Usuario Masivo ${i}`,
      username: `user_massive_${i}_${crypto.randomBytes(3).toString('hex')}`,
      email: `user_${i}_${crypto.randomBytes(2).toString('hex')}@example.com`,
      password: 'no-password-needed-for-seed',
      rol: rolUsuario.ALUMNO,
      status: UserStatus.ACTIVE,
      activo: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  await batchInsert(Usuario, usuarios);
  console.log('✅ Usuarios insertados.');

  const numProductos = 5000;
  console.log(`📦 Generando ${numProductos} productos...`);
  const productos: any[] = [];
  for (let i = 0; i < numProductos; i++) {
    productos.push({
      id: crypto.randomUUID(),
      nombre: `Producto Masivo ${i}`,
      marca: 'Marca Blanca',
      unidad: UnidadMedida.KG,
      tipo: TipoProducto.OTRO,
      contenido: 1,
      codigoBarras: `MB-${crypto.randomBytes(4).toString('hex')}`,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  await batchInsert(Producto, productos);
  console.log('✅ Productos insertados.');

  console.log('🧪 Asignando alérgenos a productos masivos...');
  const baseAlergenos = Object.values(Alergeno);
  const productoAlergenos: any[] = [];
  for (const p of productos) {
    if (Math.random() > 0.3) {
      const numAlergenos = Math.floor(Math.random() * 3) + 1;
      const selected = Array.from(
        { length: numAlergenos },
        () => baseAlergenos[Math.floor(Math.random() * baseAlergenos.length)]
      );
      const uniqueSelected = Array.from(new Set(selected));

      for (const al of uniqueSelected) {
        productoAlergenos.push({
          id: crypto.randomUUID(),
          productoId: p.id,
          alergeno: al,
          version: 1,
        });
      }
    }
  }
  await batchInsert(ProductoAlergeno, productoAlergenos);
  console.log('✅ Alérgenos asignados.');

  console.log('🔗 Vinculando productos con proveedores...');
  const allProvs = await dataSource.getRepository(Proveedor).find();
  const allProds = await dataSource
    .getRepository(Producto)
    .find({ skip: 0, take: numProductos });

  const ppValues: Partial<ProductoProveedor>[] = [];
  for (const p of allProds) {
    const prov = allProvs[Math.floor(Math.random() * allProvs.length)];
    ppValues.push({
      id: crypto.randomUUID(),
      productoId: p.id,
      proveedorId: prov.id,
      precioUnitario: Math.random() * 50,
      mermaEsperada: Math.random() * 10,
      marca: p.marca,
      codigoBarras: p.codigoBarras,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  await batchInsert(ProductoProveedor, ppValues);
  console.log('✅ ProductoProveedor insertados.');

  console.log('🏠 Generando registros de inventario...');
  const allPPs = await dataSource
    .getRepository(ProductoProveedor)
    .find({ relations: ['producto'] });
  const allUbis = await dataSource.getRepository(Ubicacion).find();
  if (allUbis.length === 0)
    throw new Error('No hay ubicaciones. Ejecuta seed base primero.');

  const invValues: Partial<Inventario>[] = [];
  for (const pp of allPPs) {
    const ubi = allUbis[Math.floor(Math.random() * allUbis.length)];
    invValues.push({
      id: crypto.randomUUID(),
      productoProveedorId: pp.id,
      ubicacionId: ubi.id,
      cantidadActual: Math.random() * 100,
      cantidadMinima: 10,
      cantidadMaxima: 200,
      fechaEntrada: new Date(),
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  await batchInsert(Inventario, invValues);
  console.log('✅ Inventario insertado.');

  const TOTAL_MOVIMIENTOS = 1000000;
  const BATCH_SIZE_MOV = 5000;
  const numBatches = TOTAL_MOVIMIENTOS / BATCH_SIZE_MOV;

  const allInvs = await dataSource
    .getRepository(Inventario)
    .find({ relations: ['productoProveedor'] });
  const userBase = await dataSource
    .getRepository(Usuario)
    .findOne({ where: {} });

  console.log(
    `📉 Generando ${TOTAL_MOVIMIENTOS.toLocaleString()} movimientos...`
  );
  for (let i = 0; i < numBatches; i++) {
    const batch: Partial<Movimiento>[] = [];
    for (let j = 0; j < BATCH_SIZE_MOV; j++) {
      const inv = allInvs[Math.floor(Math.random() * allInvs.length)];
      batch.push({
        id: crypto.randomUUID(),
        tipo:
          j % 2 === 0
            ? TipoMovimiento.ENTRADA_COMPRA
            : TipoMovimiento.SALIDA_ELABORACION,
        cantidad: Math.floor(Math.random() * 10),
        usuarioId: userBase?.id,
        inventarioId: inv.id,
        productoProveedorId: inv.productoProveedor?.id,
        entidad: 'MassiveSeeder',
        entidadId: crypto.randomUUID(),
        descripcion: `Movimiento automático #${i * BATCH_SIZE_MOV + j}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await dataSource
      .createQueryBuilder()
      .insert()
      .into(Movimiento)
      .values(batch)
      .orIgnore()
      .execute();

    if ((i + 1) % 40 === 0 || i === numBatches - 1) {
      const progress = (((i + 1) / numBatches) * 100).toFixed(1);
      console.log(
        `⏳ Progreso Movimientos: ${progress}% (${((i + 1) * BATCH_SIZE_MOV).toLocaleString()} registros)`
      );
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  console.log(
    `✅ Inserción MEGA-MASIVA completada en ${totalTime.toFixed(2)}s`
  );
  await dataSource.destroy();
}

void runMegaMassiveSeeder();
