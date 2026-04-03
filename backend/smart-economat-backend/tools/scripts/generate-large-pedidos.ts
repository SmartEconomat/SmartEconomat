import 'reflect-metadata';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: join(__dirname, '../../../../.env') });

import { DataSource } from 'typeorm';

import { dbConfig } from '../../src/config/database.config';
import {
  Pedido,
  EstadoPedido,
} from '../../src/modules/pedido/pedido.entity/pedido.entity';
import { PedidoProducto } from '../../src/modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { Usuario } from '../../src/modules/usuario/usuario.entity/usuario.entity';
import { Proveedor } from '../../src/modules/proveedor/proveedor.entity/proveedor.entity';
import { Producto } from '../../src/modules/producto/producto.entity/producto.entity';
import { ProductoProveedor } from '../../src/modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import {
  UnidadMedida,
  TipoProducto,
} from '../../src/modules/producto/enums/producto.enums';

export const dataSource = new DataSource({
  ...dbConfig,
  synchronize: false,
});

async function generateLargePedidos() {
  try {
    const { faker } = await import('@faker-js/faker');
    await dataSource.initialize();
    console.log(' Conectado a la base de datos.');

    const pedidoRepo = dataSource.getRepository(Pedido);
    const usuarioRepo = dataSource.getRepository(Usuario);
    const proveedorRepo = dataSource.getRepository(Proveedor);
    const productoRepo = dataSource.getRepository(Producto);
    const productoProveedorRepo = dataSource.getRepository(ProductoProveedor);

    const usuarios = await usuarioRepo.find();
    if (usuarios.length === 0) {
      throw new Error(
        'No se encontraron usuarios en la base de datos. Ejecuta el seed base primero.'
      );
    }

    let proveedor = proveedorRepo.create({
      nombre: 'Mega Proveedor Masivo - ' + faker.company.name(),
      contacto: faker.person.fullName(),
      telefono: faker.phone.number({ style: 'national' }).slice(0, 15),
      email: faker.internet.email(),
      direccion: faker.location.streetAddress(),
      nif: faker.string.alphanumeric(9).toUpperCase(),
    });
    proveedor = await proveedorRepo.save(proveedor);
    console.log(` Proveedor creado: \${proveedor.nombre}`);

    const NUM_PRODUCTS = 50;
    console.log(` Creando \${NUM_PRODUCTS} productos para este proveedor...`);

    let dbProducts: Producto[] = [];
    for (let i = 0; i < NUM_PRODUCTS; i++) {
      const p = productoRepo.create({
        nombre:
          faker.commerce.productName() + ' ' + faker.string.alphanumeric(4),
        marca: faker.company.name(),
        descripcion: faker.commerce.productDescription(),
        unidad: faker.helpers.arrayElement(Object.values(UnidadMedida)),
        tipo: faker.helpers.arrayElement(Object.values(TipoProducto)),
        pathImg: faker.image.url({ width: 640, height: 480 }),
        contenido: faker.number.int({ min: 1, max: 1000 }),
        codigoBarras: faker.string.numeric(13),
      });
      dbProducts.push(p);
    }
    dbProducts = await productoRepo.save(dbProducts);

    const productProviders: ProductoProveedor[] = [];
    for (const producto of dbProducts) {
      const pp = productoProveedorRepo.create({
        producto,
        proveedor,
        precioUnitario: parseFloat(faker.commerce.price({ min: 2, max: 50 })),
        marca: producto.marca,
        codigoBarras: faker.string.numeric(13),
      });
      productProviders.push(pp);
    }
    await productoProveedorRepo.save(productProviders);
    console.log(
      ' Productos correctamente vinculados al proveedor en [producto_proveedor].'
    );

    const NUM_PEDIDOS = 100;
    console.log(
      ` Generando \${NUM_PEDIDOS} pedidos, cada uno con \${NUM_PRODUCTS} productos...`
    );

    const pedidosArray: Pedido[] = [];

    for (let i = 0; i < NUM_PEDIDOS; i++) {
      const usuarioAleatorio = faker.helpers.arrayElement(usuarios);

      const pedido = pedidoRepo.create({
        usuario: usuarioAleatorio,
        proveedor: proveedor,
        fechaPedido: faker.date.recent({ days: 30 }),
        estado: EstadoPedido.PENDIENTE_DE_APROBACION,
        costeTotal: 0,
      });

      const detallesPedido: PedidoProducto[] = [];
      let costTotal = 0;

      for (const pp of productProviders) {
        const cantidad = faker.number.int({ min: 1, max: 20 });
        const pUnit = pp.precioUnitario || 10;
        const sub = cantidad * pUnit;
        costTotal += sub;

        const detalle = new PedidoProducto();
        detalle.productoProveedor = pp;
        detalle.cantidad = cantidad;
        detalle.precioUnitario = pUnit;

        detallesPedido.push(detalle);
      }

      pedido.pedidoProductos = detallesPedido;
      pedido.costeTotal = parseFloat(costTotal.toFixed(2));
      pedidosArray.push(pedido);
    }

    console.log(' Insertando en la base de datos en bloques de 10 pedidos...');
    const CHUNK_SIZE = 10;
    for (let i = 0; i < pedidosArray.length; i += CHUNK_SIZE) {
      const chunk = pedidosArray.slice(i, i + CHUNK_SIZE);
      await pedidoRepo.save(chunk);
      console.log(
        `   Bloque guardado: \${Math.min(i + CHUNK_SIZE, pedidosArray.length)} / \${pedidosArray.length} pedidos totales.`
      );
    }

    console.log(' ¡Éxito! BBDD poblada con los pedidos masivos correctamente.');
  } catch (err) {
    console.error(' Error generando pedidos masivos:', err);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void generateLargePedidos();
