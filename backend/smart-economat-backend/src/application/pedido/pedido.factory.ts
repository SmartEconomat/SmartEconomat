import { EntityManager, In } from 'typeorm';
import { CreatePedidoDto } from '../../modules/pedido/dto/create-pedido.dto';
import { Pedido } from '../../modules/pedido/pedido.entity/pedido.entity';
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
 * Crea la instancia de `Pedido` y valida las líneas suministradas.
 * Esta función extrae la lógica de validación y cálculo de `PedidoService.create`.
 */
export async function buildPedidoAggregate(
  manager: EntityManager,
  dto: CreatePedidoDto,
  userId: string,
  initialStatus: any,
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
      find?: (entity: any, options?: any) => Promise<ProductoProveedor[]>;
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
          entity: any,
          options?: any
        ) => Promise<ProductoProveedor | undefined>;
      }
    ).findOne;

    if (typeof maybeFindOne === 'function') {
      productoProveedoresResolved = (
        await Promise.all(
          productoProveedorIds.map((id) =>
            maybeFindOne.call(manager, ProductoProveedor, {
              where: { id },
              relations: ['proveedor'],
            })
          )
        )
      ).filter(Boolean) as ProductoProveedor[];
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
    usuario: { id: userId },
    proveedor: { id: proveedorId },
    estado: initialStatus,
    costeTotal,
    fechaEntrega: calculateFechaEntrega(),
    observaciones,
  });

  return { pedido, pedidoProductos: pedidoProductosEntities, costeTotal };
}
