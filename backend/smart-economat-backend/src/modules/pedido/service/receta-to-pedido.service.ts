import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Pedido } from '../pedido.entity/pedido.entity';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { GeneratePedidoFromRecetasDto } from '../dto/generate-pedido-from-recetas.dto';
import { PedidoService } from './pedido.service';
import { RecetaRepository } from '../../receta/repository/receta.repository';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { Receta } from '../../receta/receta.entity/receta.entity';
import { UnidadIngrediente } from '../../receta/enums/receta.enums';

type ConsolidatedIngredient = {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  unidad: UnidadIngrediente;
};

@Injectable()
export class RecetaToPedidoService {
  private readonly logger = new Logger(RecetaToPedidoService.name);

  constructor(
    private readonly recetaRepository: RecetaRepository,
    private readonly pedidoService: PedidoService,
    private readonly dataSource: DataSource
  ) {}

  async generateFromRecetas(
    dto: GeneratePedidoFromRecetasDto,
    userId: string
  ): Promise<Pedido> {
    const recetas = await this.loadRecetas(dto.recetaIds);
    const consolidado = this.consolidarIngredientes(recetas);

    if (consolidado.size === 0) {
      throw new BadRequestException(
        'Las recetas seleccionadas no contienen ingredientes para generar un pedido.'
      );
    }

    const productosProveedor = await this.dataSource
      .getRepository(ProductoProveedor)
      .find({
        where: { productoId: In(Array.from(consolidado.keys())) },
        relations: ['producto', 'proveedor'],
      });

    const productosPorId = new Map<string, ProductoProveedor[]>();
    for (const productoProveedor of productosProveedor) {
      const existing = productosPorId.get(productoProveedor.productoId) ?? [];
      existing.push(productoProveedor);
      productosPorId.set(productoProveedor.productoId, existing);
    }

    const proveedorId = this.selectProveedorComun(consolidado, productosPorId);

    const lineas = Array.from(consolidado.values()).map((ingrediente) => {
      const productoProveedor = (
        productosPorId.get(ingrediente.productoId) ?? []
      ).find(
        (item) =>
          item.proveedorId === proveedorId &&
          item.precioUnitario !== null &&
          item.precioUnitario !== undefined
      );

      if (!productoProveedor) {
        throw new BadRequestException(
          `No existe una asignación válida del proveedor seleccionado para el producto ${ingrediente.productoNombre}.`
        );
      }

      return {
        productoProveedorId: productoProveedor.id,
        cantidad: this.roundQuantity(ingrediente.cantidad),
      };
    });

    const createPedidoDto: CreatePedidoDto = {
      proveedorId,
      observaciones: dto.observaciones,
      lineas,
    };

    const pedido = await this.pedidoService.create(createPedidoDto, userId);

    this.logger.log(
      `Pedido ${pedido.id} generado desde recetas [${dto.recetaIds.join(', ')}] por usuario ${userId}. ` +
        `Proveedor consolidado: ${proveedorId}.` +
        (dto.observaciones ? ` Observaciones: ${dto.observaciones}` : '')
    );

    return pedido;
  }

  private async loadRecetas(recetaIds: string[]): Promise<Receta[]> {
    const recetas = await Promise.all(
      recetaIds.map((recetaId) => this.recetaRepository.findById(recetaId))
    );

    const missingIds = recetaIds.filter((_, index) => !recetas[index]);
    if (missingIds.length > 0) {
      throw new NotFoundException(
        `No se encontraron las recetas: ${missingIds.join(', ')}`
      );
    }

    return recetas as Receta[];
  }

  private consolidarIngredientes(
    recetas: Receta[]
  ): Map<string, ConsolidatedIngredient> {
    const consolidado = new Map<string, ConsolidatedIngredient>();

    for (const receta of recetas) {
      for (const ingrediente of receta.ingredientes ?? []) {
        if (!ingrediente.producto || ingrediente.producto.deletedAt) {
          throw new BadRequestException(
            `La receta ${receta.nombre} contiene un producto inactivo o no disponible.`
          );
        }

        const current = consolidado.get(ingrediente.productoId);
        const cantidadConMerma =
          Number(ingrediente.cantidad) *
          (1 + Number(ingrediente.mermaAplicada ?? 0) / 100);

        if (current && current.unidad !== ingrediente.unidad) {
          throw new BadRequestException(
            `El producto ${ingrediente.producto.nombre} aparece con unidades incompatibles en las recetas seleccionadas.`
          );
        }

        consolidado.set(ingrediente.productoId, {
          productoId: ingrediente.productoId,
          productoNombre: ingrediente.producto.nombre,
          cantidad: this.roundQuantity(
            (current?.cantidad ?? 0) + cantidadConMerma
          ),
          unidad: ingrediente.unidad,
        });
      }
    }

    return consolidado;
  }

  private selectProveedorComun(
    consolidado: Map<string, ConsolidatedIngredient>,
    productosPorId: Map<string, ProductoProveedor[]>
  ): string {
    const productoIds = Array.from(consolidado.keys());

    for (const ingrediente of consolidado.values()) {
      const proveedores = (
        productosPorId.get(ingrediente.productoId) ?? []
      ).filter(
        (item) =>
          !!item.proveedorId &&
          item.precioUnitario !== null &&
          item.precioUnitario !== undefined
      );

      if (proveedores.length === 0) {
        throw new BadRequestException(
          `El producto ${ingrediente.productoNombre} no tiene proveedor asignado activo con precio vigente.`
        );
      }
    }

    const candidateProviderIds = Array.from(
      new Set(
        productoIds.flatMap((productoId) =>
          (productosPorId.get(productoId) ?? [])
            .filter(
              (item) =>
                item.precioUnitario !== null &&
                item.precioUnitario !== undefined
            )
            .map((item) => item.proveedorId)
        )
      )
    );

    const proveedoresComunes = candidateProviderIds.filter((proveedorId) =>
      productoIds.every((productoId) =>
        (productosPorId.get(productoId) ?? []).some(
          (item) =>
            item.proveedorId === proveedorId &&
            item.precioUnitario !== null &&
            item.precioUnitario !== undefined
        )
      )
    );

    if (proveedoresComunes.length === 0) {
      throw new BadRequestException(
        'No existe un proveedor común activo para todos los ingredientes de las recetas seleccionadas.'
      );
    }

    return proveedoresComunes
      .map((proveedorId) => ({
        proveedorId,
        costeTotal: productoIds.reduce((total, productoId) => {
          const ingrediente = consolidado.get(productoId)!;
          const productoProveedor = (productosPorId.get(productoId) ?? []).find(
            (item) => item.proveedorId === proveedorId
          );

          return (
            total +
            Number(productoProveedor?.precioUnitario ?? 0) *
              Number(ingrediente.cantidad)
          );
        }, 0),
      }))
      .sort((a, b) => a.costeTotal - b.costeTotal)[0].proveedorId;
  }

  private roundQuantity(value: number): number {
    return Number(value.toFixed(4));
  }
}
