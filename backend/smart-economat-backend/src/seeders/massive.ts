import 'reflect-metadata';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { dataSource, runAllSeeders } from './seed';
import { AppModule } from '../app.module';
import { SeedContext } from './seed-context';
import { Proveedor } from '../modules/proveedor/proveedor.entity/proveedor.entity';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import { Inventario } from '../modules/inventario/inventario.entity/inventario.entity';
import {
  UnidadMedida,
  TipoProducto,
} from '../modules/producto/enums/producto.enums';
import { ProveedorService } from '../modules/proveedor/service/proveedor.service';
import { ProductoService } from '../modules/producto/service/producto.service';
import { InventarioService } from '../modules/inventario/service/inventario.service';
import { UbicacionService } from '../modules/ubicacion/service/ubicacion.service';
import { Ubicacion } from '../modules/ubicacion/ubicacion.entity/ubicacion.entity';
import { CreateProveedorDto } from '../modules/proveedor/dto/create-proveedor.dto';
import { CreateProductoDto } from '../modules/producto/dto/create-producto.dto';
import { CreateInventarioItemDto } from '../modules/inventario/dto/create-InventarioItem.dto';
import { CreateUbicacionDto } from '../modules/ubicacion/dto/create-ubicacion.dto';
import { CreateMovimientoManualDto } from '../modules/inventario/dto/create-movimiento-manual.dto';
import { TipoMovimientoManual } from '../modules/movimiento/enums/movimiento.enums';

dotenv.config({ path: join(__dirname, '../../../../.env') });

async function createMassiveContext(): Promise<SeedContext> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  return new SeedContext(app, dataSource);
}

async function runMegaMassiveSeeder() {
  const providerCount = Number(process.env.MASSIVE_PROVIDER_COUNT || 10);
  const productCount = Number(process.env.MASSIVE_PRODUCT_COUNT || 50);
  const movementCount = Number(process.env.MASSIVE_MOVEMENT_COUNT || 500);

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  console.log('🚀 Iniciando seeder masivo alineado con lógica de negocio...');
  const startTime = Date.now();

  await runAllSeeders();

  const context = await createMassiveContext();

  try {
    const { faker } = await import('@faker-js/faker');
    const proveedorService = context.get<ProveedorService>(ProveedorService);
    const productoService = context.get<ProductoService>(ProductoService);
    const inventarioService = context.get<InventarioService>(InventarioService);
    const ubicacionService = context.get<UbicacionService>(UbicacionService);
    const actorId = await context.getSeedActorUserId();

    let ubicacionMasiva = await context.findOne(Ubicacion, {
      where: { nombre: 'Almacén Masivo Seed' } as any,
    });

    if (!ubicacionMasiva) {
      ubicacionMasiva = await ubicacionService.create(
        await context.validateDto(CreateUbicacionDto, {
          nombre: 'Almacén Masivo Seed',
          descripcion:
            'Ubicación creada por el seeder masivo mediante servicios',
        })
      );
    }

    for (let i = 0; i < providerCount; i++) {
      const nif = `MASSEED${String(i + 1).padStart(3, '0')}`;
      const existing = await context.findOne(Proveedor, {
        where: { nif } as any,
      });
      if (existing) {
        continue;
      }

      await proveedorService.create(
        await context.validateDto(CreateProveedorDto, {
          nombre: `Proveedor Masivo ${i + 1}`,
          email: `massive.provider.${i + 1}@smarteconomat.test`,
          direccion: faker.location.streetAddress(),
          nif,
          telefono: faker.phone.number().slice(0, 20),
        })
      );
    }

    const proveedores = await context.find(Proveedor, {
      order: { createdAt: 'ASC' } as any,
    });

    for (let i = 0; i < productCount; i++) {
      const barcode = String(9500000000000 + i);
      const existing = await context.findOne(Producto, {
        where: { codigoBarras: barcode } as any,
      });
      if (existing) {
        continue;
      }

      const proveedor = proveedores[i % proveedores.length];
      const producto = await productoService.create(
        await context.validateDto(CreateProductoDto, {
          nombre: `Producto Masivo ${i + 1}`,
          marca: 'Massive Seed',
          descripcion: 'Producto generado por flujo masivo de seeding',
          unidad: UnidadMedida.KG,
          tipo: TipoProducto.OTRO,
          contenido: 1,
          codigoBarras: barcode,
          proveedores: [
            {
              proveedorId: proveedor.id,
              precioUnitario: Number((5 + (i % 30)).toFixed(2)),
              marcaEspecifica: 'Massive Seed',
              codigoBarras: barcode,
            },
          ],
        }),
        actorId
      );

      const productoProveedor = producto.proveedores?.[0];
      if (!productoProveedor) {
        continue;
      }

      const existingInventory = await context.findOne(Inventario, {
        where: { productoProveedor: { id: productoProveedor.id } } as any,
      });
      if (!existingInventory) {
        await inventarioService.create(
          await context.validateDto(CreateInventarioItemDto, {
            productoProveedorId: productoProveedor.id,
            cantidadActual: 100,
            cantidadMinima: 10,
            cantidadMaxima: 250,
            ubicacionId: ubicacionMasiva.id,
          }),
          actorId
        );
      }
    }

    const inventarios = await context.find(Inventario, {
      relations: ['productoProveedor', 'productoProveedor.producto'],
      take: Math.max(50, movementCount),
    });

    for (let i = 0; i < movementCount; i++) {
      const inventario = inventarios[i % inventarios.length];
      const isEntrada = i % 3 === 0;

      await inventarioService.ajustarManual(
        await context.validateDto(CreateMovimientoManualDto, {
          inventarioId: inventario.id,
          tipo: isEntrada
            ? TipoMovimientoManual.ENTRADA
            : TipoMovimientoManual.SALIDA_AJUSTE,
          ajuste: isEntrada ? 2 : -1,
          motivo: `MASSIVE-SEED-${i + 1}`,
          observaciones: `Movimiento masivo ${i + 1} para ${inventario.productoProveedor?.producto?.nombre || inventario.id}`,
        }),
        actorId
      );
    }

    const totalTime = (Date.now() - startTime) / 1000;
    console.log(
      `✅ Seeder masivo completado en ${totalTime.toFixed(2)}s usando lógica de negocio`
    );
  } finally {
    await context.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void runMegaMassiveSeeder();
