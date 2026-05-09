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
import { CreatePedidoUsuarioDto } from '../dto/pedido-usuario.dto';
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

type ResolvedPedidoLine = {
  productoProveedorId: string;
  cantidad: number;
};

type ResolvedRecetaPedidoPayload = {
  proveedorId: string;
  lineas: ResolvedPedidoLine[];
};

type ResolvedRecetaBatchPayload = {
  lineas: ResolvedPedidoLine[];
  proveedorIds: string[];
};

type ResolvedRecetaIngredientContext = {
  consolidado: Map<string, ConsolidatedIngredient>;
  productosPorId: Map<string, ProductoProveedor[]>;
};

/**
 * Servicio de dominio para receta to pedido.
 */
@Injectable()
export class RecetaToPedidoService {
  private readonly logger = new Logger(RecetaToPedidoService.name);

  /**
   * Construye la instancia configurada.
   * @undefined {RecetaRepository} recetaRepository - Entrada efectiva esperada por el contrato.
   * @undefined {PedidoService} pedidoService - Entrada efectiva esperada por el contrato.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly recetaRepository: RecetaRepository,
    private readonly pedidoService: PedidoService,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Genera artefactos sintéticos a partir del estado conocido.
   * @undefined {GeneratePedidoFromRecetasDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Pedido>} Datos efectivos después de ejecutar la operación.
   */
  async generateFromRecetas(
    dto: GeneratePedidoFromRecetasDto,
    userId: string
  ): Promise<Pedido> {
    const { proveedorId, lineas } =
      await this.resolveSinglePedidoPayloadFromRecetas(dto);

    const createPedidoDto: CreatePedidoDto = {
      proveedorId,
      observaciones: dto.observaciones,
      lineas,
    };

    const pedido = await this.pedidoService.create(createPedidoDto, userId);

    this.logger.log(
      `Pedido ${pedido.id} generado desde recetas [${dto.recetaIds.join(', ')}] por usuario ${userId}. ` +
        `Proveedor del pedido: ${proveedorId}.` +
        (dto.observaciones ? ` Observaciones: ${dto.observaciones}` : '')
    );

    return pedido;
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "buildBatchOrderFromRecetas" en smart-economat-backend (Nest).
   * @undefined {GeneratePedidoFromRecetasDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<CreatePedidoUsuarioDto>} Datos efectivos después de ejecutar la operación.
   */
  async buildBatchOrderFromRecetas(
    dto: GeneratePedidoFromRecetasDto
  ): Promise<CreatePedidoUsuarioDto> {
    const { lineas, proveedorIds } =
      await this.resolveBatchPayloadFromRecetas(dto);

    this.logger.log(
      `Compra agrupada generada desde recetas [${dto.recetaIds.join(', ')}] con ${proveedorIds.length} proveedor(es).` +
        (dto.observaciones ? ` Observaciones: ${dto.observaciones}` : '')
    );

    return {
      observaciones: dto.observaciones,
      lineas,
    };
  }

  private async resolveSinglePedidoPayloadFromRecetas(
    dto: GeneratePedidoFromRecetasDto
  ): Promise<ResolvedRecetaPedidoPayload> {
    const { consolidado, productosPorId } =
      await this.resolveIngredientContext(dto);
    const proveedorId = this.selectSinglePedidoProvider(
      consolidado,
      productosPorId,
      dto.proveedorId
    );

    return {
      proveedorId,
      lineas: this.buildLinesForProveedor(
        consolidado,
        productosPorId,
        proveedorId
      ),
    };
  }

  private async resolveBatchPayloadFromRecetas(
    dto: GeneratePedidoFromRecetasDto
  ): Promise<ResolvedRecetaBatchPayload> {
    if (dto.proveedorId) {
      const singlePedido =
        await this.resolveSinglePedidoPayloadFromRecetas(dto);
      return {
        lineas: singlePedido.lineas,
        proveedorIds: [singlePedido.proveedorId],
      };
    }

    const { consolidado, productosPorId } =
      await this.resolveIngredientContext(dto);
    const lineas: ResolvedPedidoLine[] = [];
    const proveedorIds = new Set<string>();

    for (const ingrediente of consolidado.values()) {
      const productoProveedor = this.selectCheapestProveedorForIngredient(
        ingrediente,
        productosPorId
      );

      lineas.push({
        productoProveedorId: productoProveedor.id,
        cantidad: this.roundQuantity(ingrediente.cantidad),
      });
      proveedorIds.add(productoProveedor.proveedorId);
    }

    return {
      lineas,
      proveedorIds: Array.from(proveedorIds),
    };
  }

  private async resolveIngredientContext(
    dto: GeneratePedidoFromRecetasDto
  ): Promise<ResolvedRecetaIngredientContext> {
    const recetas = await this.loadRecetas(dto.recetaIds);
    const consolidado = this.consolidarIngredientes(recetas);

    if (consolidado.size === 0) {
      throw new BadRequestException(
        'Las recetas seleccionadas no contienen ingredientes para generar un pedido.'
      );
    }

    const productosPorId = await this.loadProductosPorIngrediente(consolidado);

    for (const ingrediente of consolidado.values()) {
      this.getEligibleProductProviders(ingrediente, productosPorId);
    }

    return { consolidado, productosPorId };
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
        if (
          !ingrediente.producto ||
          ingrediente.producto.deletedAt ||
          ingrediente.producto.activo === false
        ) {
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

  private async loadProductosPorIngrediente(
    consolidado: Map<string, ConsolidatedIngredient>
  ): Promise<Map<string, ProductoProveedor[]>> {
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

    return productosPorId;
  }

  private selectSinglePedidoProvider(
    consolidado: Map<string, ConsolidatedIngredient>,
    productosPorId: Map<string, ProductoProveedor[]>,
    requestedProveedorId?: string
  ): string {
    if (requestedProveedorId) {
      for (const ingrediente of consolidado.values()) {
        const proveedorSeleccionado = this.findProveedorForIngredient(
          ingrediente,
          productosPorId,
          requestedProveedorId
        );

        if (!proveedorSeleccionado) {
          throw new BadRequestException(
            `No es posible generar un pedido único para el proveedor seleccionado porque el producto ${ingrediente.productoNombre} no está disponible con ese proveedor. Usa /pedido-usuarios/from-recipes si necesitas repartir la compra entre varios proveedores.`
          );
        }
      }

      return requestedProveedorId;
    }

    const productoIds = Array.from(consolidado.keys());

    for (const ingrediente of consolidado.values()) {
      this.getEligibleProductProviders(ingrediente, productosPorId);
    }

    const candidateProviderIds = Array.from(
      new Set(
        productoIds.flatMap((productoId) =>
          (productosPorId.get(productoId) ?? []).map((item) => item.proveedorId)
        )
      )
    ).filter(Boolean);

    const proveedoresComunes = candidateProviderIds.filter((proveedorId) =>
      productoIds.every((productoId) =>
        (productosPorId.get(productoId) ?? []).some((item) => {
          return (
            item.proveedorId === proveedorId &&
            item.precioUnitario !== null &&
            item.precioUnitario !== undefined
          );
        })
      )
    );

    if (proveedoresComunes.length === 0) {
      throw new BadRequestException(
        'Las recetas seleccionadas requieren varios proveedores. Un pedido solo puede pertenecer a un proveedor; indica proveedorId o usa /pedido-usuarios/from-recipes para generar una compra agrupada.'
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

  private buildLinesForProveedor(
    consolidado: Map<string, ConsolidatedIngredient>,
    productosPorId: Map<string, ProductoProveedor[]>,
    proveedorId: string
  ): ResolvedPedidoLine[] {
    return Array.from(consolidado.values()).map((ingrediente) => {
      const productoProveedor = this.findProveedorForIngredient(
        ingrediente,
        productosPorId,
        proveedorId
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
  }

  private selectCheapestProveedorForIngredient(
    ingrediente: ConsolidatedIngredient,
    productosPorId: Map<string, ProductoProveedor[]>
  ): ProductoProveedor {
    const proveedores = this.getEligibleProductProviders(
      ingrediente,
      productosPorId
    );

    return proveedores[0];
  }

  private findProveedorForIngredient(
    ingrediente: ConsolidatedIngredient,
    productosPorId: Map<string, ProductoProveedor[]>,
    proveedorId: string
  ): ProductoProveedor | null {
    return (
      this.getEligibleProductProviders(ingrediente, productosPorId).find(
        (item) => item.proveedorId === proveedorId
      ) || null
    );
  }

  private getEligibleProductProviders(
    ingrediente: ConsolidatedIngredient,
    productosPorId: Map<string, ProductoProveedor[]>
  ): ProductoProveedor[] {
    const proveedores = (productosPorId.get(ingrediente.productoId) ?? [])
      .filter(
        (item) =>
          !!item.proveedorId &&
          item.precioUnitario !== null &&
          item.precioUnitario !== undefined
      )
      .sort((left, right) => {
        const priceDiff =
          Number(left.precioUnitario) - Number(right.precioUnitario);
        if (priceDiff !== 0) {
          return priceDiff;
        }

        const providerDiff = left.proveedorId.localeCompare(right.proveedorId);
        if (providerDiff !== 0) {
          return providerDiff;
        }

        return left.id.localeCompare(right.id);
      });

    if (proveedores.length === 0) {
      throw new BadRequestException(
        `El producto ${ingrediente.productoNombre} no tiene proveedor asignado activo con precio vigente.`
      );
    }

    return proveedores;
  }

  private roundQuantity(value: number): number {
    return Number(value.toFixed(4));
  }
}
