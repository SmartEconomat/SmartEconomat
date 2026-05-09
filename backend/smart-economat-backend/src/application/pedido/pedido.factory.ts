import { EntityManager, In } from 'typeorm';
import { CreatePedidoDto } from '../../modules/pedido/dto/create-pedido.dto';
import { Pedido } from '../../modules/pedido/pedido.entity/pedido.entity';
import { EstadoPedido } from '../../modules/pedido/enums/estado-pedido.enum';
import { PedidoProducto } from '../../modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { ProductoProveedor } from '../../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import { Proveedor } from '../../modules/proveedor/proveedor.entity/proveedor.entity';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

/** Alias público (BuiltPedido) para simplificar payloads o props en smart-economat-backend (Nest). */
export type BuiltPedido = {
  pedido: Pedido;
  pedidoProductos: Partial<PedidoProducto>[];
  costeTotal: number;
};

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "buildPedidoAggregate" en smart-economat-backend (Nest).
 * @undefined {EntityManager} manager - Entrada efectiva esperada por el contrato.
 * @undefined {CreatePedidoDto} dto - Entrada efectiva esperada por el contrato.
 * @undefined {string} userId - Entrada efectiva esperada por el contrato.
 * @undefined {string} initialStatus - Entrada efectiva esperada por el contrato.
 * @undefined {() => Date} calculateFechaEntrega - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<BuiltPedido>} Datos efectivos después de ejecutar la operación.
 */
export async function buildPedidoAggregate(
  manager: EntityManager,
  dto: CreatePedidoDto,
  userId: string,
  initialStatus: string,
  calculateFechaEntrega: () => Date
): Promise<BuiltPedido> {
  const { lineas, proveedorId, observaciones } = dto;

  if (!lineas || lineas.length === 0) {
    throw new BadRequestException(
      'El pedido debe contener al menos un producto.'
    );
  }

  const mainProveedor = await manager.findOne(Proveedor, {
    where: { id: proveedorId },
  });

  if (!mainProveedor) {
    throw new NotFoundException(
      `El proveedor con ID ${proveedorId} no existe.`
    );
  }

  if (mainProveedor.deletedAt) {
    throw new BadRequestException(
      `El proveedor ${mainProveedor.nombre} está desactivado y no puede recibir nuevos pedidos.`
    );
  }

  const productoProveedorIds = lineas.map((l) => l.productoProveedorId);

  let productoProveedoresResolved: ProductoProveedor[] = [];

  const maybeFind = (
    manager as unknown as {
      find?: (
        entity: typeof ProductoProveedor,
        options?: { where: { id: number[] }; relations: string[] }
      ) => Promise<ProductoProveedor[]>;
    }
  ).find;

  if (typeof maybeFind === 'function') {
    productoProveedoresResolved = await maybeFind.call(
      manager,
      ProductoProveedor,
      {
        where: { id: In(productoProveedorIds) },
        relations: ['proveedor'],
      }
    );
  } else {
    const maybeFindOne = (
      manager as unknown as {
        findOne?: (
          entity: typeof ProductoProveedor,
          options?: { where: { id: number }; relations: string[] }
        ) => Promise<ProductoProveedor | undefined>;
      }
    ).findOne;

    if (typeof maybeFindOne === 'function') {
      const resolved: (ProductoProveedor | undefined)[] = await Promise.all(
        productoProveedorIds.map(
          (id) =>
            maybeFindOne.call(manager, ProductoProveedor, {
              where: { id },
              relations: ['proveedor'],
            }) as Promise<ProductoProveedor | undefined>
        )
      );
      productoProveedoresResolved = resolved.filter(
        (pp: ProductoProveedor | undefined): pp is ProductoProveedor => {
          return typeof pp !== 'undefined' && pp !== null;
        }
      );
    } else {
      throw new ConflictException(
        'El gestor de entidades no soporta métodos de búsqueda necesarios.'
      );
    }
  }

  const ppMap = new Map(productoProveedoresResolved.map((pp) => [pp.id, pp]));

  let costeTotal = 0;
  const pedidoProductosEntities: Partial<PedidoProducto>[] = [];

  for (const linea of lineas) {
    const productoProveedor = ppMap.get(linea.productoProveedorId);

    if (!productoProveedor) {
      throw new NotFoundException(
        `El producto proveedor con ID ${linea.productoProveedorId} no existe.`
      );
    }

    if (productoProveedor.proveedorId !== proveedorId) {
      throw new BadRequestException(
        `El producto proveedor con ID ${linea.productoProveedorId} no pertenece al proveedor del pedido.`
      );
    }

    if (productoProveedor.proveedor?.deletedAt) {
      throw new BadRequestException(
        `El proveedor ${productoProveedor.proveedor.nombre} está desactivado y no puede recibir nuevos pedidos.`
      );
    }

    const precioVigente = productoProveedor.precioUnitario;
    if (precioVigente === null || precioVigente === undefined) {
      throw new ConflictException(
        `El producto proveedor con ID ${linea.productoProveedorId} no tiene un precio vigente (precio pactado) configurado.`
      );
    }

    const costeLinea = Number(precioVigente) * Number(linea.cantidad);
    costeTotal += costeLinea;

    pedidoProductosEntities.push({
      productoProveedorId: productoProveedor.id,
      cantidad: linea.cantidad,
      precioUnitario: precioVigente,
    });
  }

  const pedido = manager.create(Pedido, {
    usuarioId: userId,
    proveedorId: proveedorId,
    estado: initialStatus as EstadoPedido,
    costeTotal,
    fechaEntrega: calculateFechaEntrega(),
    observaciones,
  });

  return {
    pedido,
    pedidoProductos: pedidoProductosEntities,
    costeTotal: Number(costeTotal),
  };
}
