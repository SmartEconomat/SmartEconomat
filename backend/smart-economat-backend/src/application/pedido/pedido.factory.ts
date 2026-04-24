import { EntityManager, In } from 'typeorm';
import { CreatePedidoDto } from '../../modules/pedido/dto/create-pedido.dto';
import { Pedido } from '../../modules/pedido/pedido.entity/pedido.entity';
import { EstadoPedido } from '../../modules/pedido/enums/estado-pedido.enum';
import { PedidoProducto } from '../../modules/pedido/pedido-producto.entity/pedido-producto.entity';
import { ProductoProveedor } from '../../modules/producto/producto-proveedor.entity/producto-proveedor.entity';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

export type BuiltPedido = {
  pedido: Pedido;
  pedidoProductos: Partial<PedidoProducto>[];
  costeTotal: number;
};

/**
 * Builds and validates a Pedido aggregate from a CreatePedidoDto inside a TypeORM transaction.
 * Validates that every order line references an existing ProductoProveedor belonging to the
 * specified proveedor and that a unit price is set. Calculates the total cost and constructs
 * the Pedido entity ready to be saved (not persisted yet).
 *
 * Supports both EntityManager instances that expose `find` (TypeORM >= 0.3)
 * and those that only expose `findOne` (tests / legacy adapters).
 *
 * @param {EntityManager} manager - Active TypeORM EntityManager from a transaction context.
 * @param {CreatePedidoDto} dto - Payload containing lineas, proveedorId and optional observaciones.
 * @param {string} userId - ID of the authenticated user placing the order.
 * @param {string} initialStatus - Initial EstadoPedido value for the new order.
 * @param {() => Date} calculateFechaEntrega - Factory function that returns the estimated delivery date.
 * @returns {Promise<BuiltPedido>} Constructed Pedido, its PedidoProducto line items, and the computed total cost.
 * @throws {BadRequestException} When the lineas array is empty.
 * @throws {NotFoundException} When a referenced ProductoProveedor ID does not exist.
 * @throws {BadRequestException} When a ProductoProveedor does not belong to the order's proveedor.
 * @throws {ConflictException} When a ProductoProveedor has no unit price or when the EntityManager
 *   does not expose a supported query method.
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
