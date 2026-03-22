import { DataSource } from 'typeorm';
import { Inventario } from '../modules/inventario/inventario.entity/inventario.entity';
import { ProductoProveedor } from '../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { Ubicacion } from '../modules/ubicacion/ubicacion.entity/ubicacion.entity';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');
  const inventarioRepo = dataSource.getRepository(Inventario);
  const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);

  await dataSource.query(
    `TRUNCATE TABLE "inventario" RESTART IDENTITY CASCADE;`
  );

  const productosProv = await productoProveedorRepo.find();
  if (productosProv.length === 0) {
    throw new Error(SeederI18nHelper.getError('NO_PRODUCTOS_PROVEEDOR'));
  }

  const ubicacionRepo = dataSource.getRepository(Ubicacion);
  await dataSource.query(
    `TRUNCATE TABLE "ubicacion" RESTART IDENTITY CASCADE;`
  );

  const tiposUbicaciones = [
    {
      nombre: 'Almacén Seco General',
      descripcion:
        'Estanterías para productos estables y no perecederos a temperatura ambiente',
    },
    {
      nombre: 'Cámara Frigorífica A (Lácteos/Vegetales)',
      descripcion: 'Mantenimiento de refrigerado entre 2°C y 8°C',
    },
    {
      nombre: 'Cámara Frigorífica B (Carnes)',
      descripcion: 'Mantenimiento de refrigerado entre 0°C y 4°C',
    },
    {
      nombre: 'Cámara de Congelación',
      descripcion: 'Mantenimiento a -18°C para congelados de largo plazo',
    },
    {
      nombre: 'Expositor Vitrina',
      descripcion: 'Productos cara al público comercial, consumo inmediato',
    },
    {
      nombre: 'Zona de Recepción / Descarga',
      descripcion: 'Punto de tránsito temporal pendiende de reubicación',
    },
    {
      nombre: 'Despensa de Limpieza',
      descripcion: 'Productos no comestibles, químicos y papelería aislados',
    },
    {
      nombre: 'Mermas y Devoluciones',
      descripcion:
        'Espacio de aislamiento para productos estropeados o pendientes de abono',
    },
  ];

  const dbUbicaciones: Ubicacion[] = [];
  for (const tipo of tiposUbicaciones) {
    const u = ubicacionRepo.create({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
    });
    dbUbicaciones.push(await ubicacionRepo.save(u));
  }

  const inventarios: Inventario[] = [];

  for (const pp of productosProv) {
    const inventario = new Inventario();
    inventario.productoProveedor = pp;
    inventario.cantidadActual = faker.number.int({ min: 50, max: 500 });
    inventario.cantidadMinima = faker.number.int({
      min: 0,
      max: inventario.cantidadActual,
    });
    inventario.ubicacion = faker.helpers.arrayElement(dbUbicaciones);
    inventario.fechaEntrada = faker.date.recent({ days: 120 });

    if (faker.datatype.boolean(0.85)) {
      inventario.fechaCaducidad = faker.date.soon({
        days: faker.number.int({ min: 1, max: 365 }),
        refDate: inventario.fechaEntrada,
      });
    } else {
      inventario.fechaCaducidad = null;
    }

    if (faker.datatype.boolean(0.7)) {
      inventario.cantidadMaxima = faker.number.int({
        min:
          Math.max(inventario.cantidadMinima, inventario.cantidadActual) + 10,
        max: 1000,
      });
    } else {
      inventario.cantidadMaxima = null;
    }

    inventarios.push(inventario);
  }

  if (inventarios.length > 0) {
    console.log(
      `Guardando ${inventarios.length} registros de inventario en lotes...`
    );
    const CHUNK_SIZE = 500;
    for (let i = 0; i < inventarios.length; i += CHUNK_SIZE) {
      const chunk = inventarios.slice(i, i + CHUNK_SIZE);
      await inventarioRepo.save(chunk);
    }
  }

  console.log(SeederI18nHelper.getSeederSuccess('inventario'));
};
