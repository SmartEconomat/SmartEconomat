import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { PassThrough } from 'stream';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { Albaran } from '../../albaran/albaran.entity/albaran.entity';
import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { Receta } from '../../receta/receta.entity/receta.entity';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { ExportAlbaranFilterDto } from '../dto/export-albaran-filter.dto';
import { ExportIncidenciaFilterDto } from '../dto/export-incidencia-filter.dto';
import { ExportInventarioFilterDto } from '../dto/export-inventario-filter.dto';
import { ExportMovimientoFilterDto } from '../dto/export-movimiento-filter.dto';
import { ExportPedidoFilterDto } from '../dto/export-pedido-filter.dto';
import { ExportProductoFilterDto } from '../dto/export-producto-filter.dto';
import { ExportProveedorFilterDto } from '../dto/export-proveedor-filter.dto';
import { ExportRecepcionFilterDto } from '../dto/export-recepcion-filter.dto';
import { ExportRecetaFilterDto } from '../dto/export-receta-filter.dto';
import { ExportUbicacionFilterDto } from '../dto/export-ubicacion-filter.dto';
import { ExportUsuarioFilterDto } from '../dto/export-usuario-filter.dto';
import {
  ExportColumn,
  PRODUCTO_COLUMNS,
  mapProductoToExcelRow,
} from '../mappers/producto-export.mapper';
import {
  PEDIDO_COLUMNS,
  mapPedidoToExcelRow,
} from '../mappers/pedido-export.mapper';
import {
  PROVEEDOR_COLUMNS,
  mapProveedorToExcelRow,
} from '../mappers/proveedor-export.mapper';
import {
  ALBARAN_COLUMNS,
  mapAlbaranToExcelRow,
} from '../mappers/albaran-export.mapper';
import {
  INCIDENCIA_COLUMNS,
  mapIncidenciaToExcelRow,
} from '../mappers/incidencia-export.mapper';
import {
  INVENTARIO_COLUMNS,
  mapInventarioToExcelRow,
} from '../mappers/inventario-export.mapper';
import {
  MOVIMIENTO_COLUMNS,
  mapMovimientoToExcelRow,
} from '../mappers/movimiento-export.mapper';
import {
  RECEPCION_COLUMNS,
  mapRecepcionToExcelRow,
} from '../mappers/recepcion-export.mapper';
import {
  RECETA_COLUMNS,
  mapRecetaToExcelRow,
} from '../mappers/receta-export.mapper';
import {
  UBICACION_COLUMNS,
  mapUbicacionToExcelRow,
} from '../mappers/ubicacion-export.mapper';
import {
  USUARIO_COLUMNS,
  mapUsuarioToExcelRow,
} from '../mappers/usuario-export.mapper';
import { buildPdfTable } from '../pdf/pdf-builder';

const BATCH_SIZE = 500;
const DEFAULT_MAX_ROWS = 5000;

const BORDER_STYLE: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD3D3D3' },
};

@Injectable()
export class ExportService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async streamProductosToExcel(
    query: ExportProductoFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToExcel(
      res,
      'Productos',
      PRODUCTO_COLUMNS,
      this.buildProductoQueryBuilder(query),
      mapProductoToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamPedidosToExcel(
    query: ExportPedidoFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToExcel(
      res,
      'Pedidos',
      PEDIDO_COLUMNS,
      this.buildPedidoQueryBuilder(query),
      mapPedidoToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamProveedoresToExcel(
    query: ExportProveedorFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToExcel(
      res,
      'Proveedores',
      PROVEEDOR_COLUMNS,
      this.buildProveedorQueryBuilder(query),
      mapProveedorToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamAlbaranesToExcel(
    query: ExportAlbaranFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToExcel(
      res,
      'Albaranes',
      ALBARAN_COLUMNS,
      this.buildAlbaranQueryBuilder(query),
      mapAlbaranToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamIncidenciasToExcel(
    query: ExportIncidenciaFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToExcel(
      res,
      'Incidencias',
      INCIDENCIA_COLUMNS,
      this.buildIncidenciaQueryBuilder(query),
      mapIncidenciaToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamInventarioToExcel(
    query: ExportInventarioFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToExcel(
      res,
      'Inventario',
      INVENTARIO_COLUMNS,
      this.buildInventarioQueryBuilder(query),
      mapInventarioToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamMovimientosToExcel(
    query: ExportMovimientoFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToExcel(
      res,
      'Movimientos',
      MOVIMIENTO_COLUMNS,
      this.buildMovimientoQueryBuilder(query),
      mapMovimientoToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamRecepcionesToExcel(
    query: ExportRecepcionFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToExcel(
      res,
      'Recepciones',
      RECEPCION_COLUMNS,
      this.buildRecepcionQueryBuilder(query),
      mapRecepcionToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamRecetasToExcel(
    query: ExportRecetaFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToExcel(
      res,
      'Recetas',
      RECETA_COLUMNS,
      this.buildRecetaQueryBuilder(query),
      mapRecetaToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamUbicacionesToExcel(
    query: ExportUbicacionFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToExcel(
      res,
      'Ubicaciones',
      UBICACION_COLUMNS,
      this.buildUbicacionQueryBuilder(query),
      mapUbicacionToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamUsuariosToExcel(
    query: ExportUsuarioFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToExcel(
      res,
      'Usuarios',
      USUARIO_COLUMNS,
      this.buildUsuarioQueryBuilder(query),
      mapUsuarioToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamProductosToPdf(
    query: ExportProductoFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToPdf(
      res,
      'Productos',
      PRODUCTO_COLUMNS,
      this.buildProductoQueryBuilder(query),
      mapProductoToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamProveedoresToPdf(
    query: ExportProveedorFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToPdf(
      res,
      'Proveedores',
      PROVEEDOR_COLUMNS,
      this.buildProveedorQueryBuilder(query),
      mapProveedorToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamInventarioToPdf(
    query: ExportInventarioFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToPdf(
      res,
      'Inventario',
      INVENTARIO_COLUMNS,
      this.buildInventarioQueryBuilder(query),
      mapInventarioToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamPedidosToPdf(
    query: ExportPedidoFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToPdf(
      res,
      'Pedidos',
      PEDIDO_COLUMNS,
      this.buildPedidoQueryBuilder(query),
      mapPedidoToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamAlbaranesToPdf(
    query: ExportAlbaranFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToPdf(
      res,
      'Albaranes',
      ALBARAN_COLUMNS,
      this.buildAlbaranQueryBuilder(query),
      mapAlbaranToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  async streamRecetasToPdf(
    query: ExportRecetaFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToPdf(
      res,
      'Recetas',
      RECETA_COLUMNS,
      this.buildRecetaQueryBuilder(query),
      mapRecetaToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  private async streamQueryToPdf<T extends object>(
    res: Response,
    title: string,
    columns: ExportColumn[],
    qb: SelectQueryBuilder<T>,
    mapper: (entity: T) => Record<string, unknown>,
    maxRows: number
  ): Promise<void> {
    await this.ensureWithinLimit(qb, maxRows);
    await this.streamToPdf(
      res,
      title,
      columns,
      (offset, limit) => this.fetchBatch(qb.clone(), offset, limit, mapper),
      maxRows
    );
  }

  private async streamQueryToExcel<T extends object>(
    res: Response,
    sheetName: string,
    columns: ExportColumn[],
    qb: SelectQueryBuilder<T>,
    mapper: (entity: T) => Record<string, unknown>,
    maxRows: number
  ): Promise<void> {
    await this.ensureWithinLimit(qb, maxRows);
    await this.streamToExcel(
      res,
      sheetName,
      columns,
      (offset, limit) => this.fetchBatch(qb.clone(), offset, limit, mapper),
      maxRows
    );
  }

  private async ensureWithinLimit<T extends object>(
    qb: SelectQueryBuilder<T>,
    maxRows: number
  ): Promise<void> {
    const totalRows = await qb.clone().getCount();

    if (totalRows > maxRows) {
      throw new BadRequestException(
        `La exportacion excede el limite permitido de ${maxRows} filas.`
      );
    }
  }

  private async streamToPdf(
    res: Response,
    title: string,
    columns: ExportColumn[],
    fetchBatch: (
      offset: number,
      limit: number
    ) => Promise<Record<string, unknown>[]>,
    maxRows: number
  ): Promise<void> {
    const rows: Record<string, unknown>[] = [];
    let offset = 0;

    while (rows.length < maxRows) {
      const remaining = maxRows - rows.length;
      const limit = Math.min(BATCH_SIZE, remaining);

      const batch = await fetchBatch(offset, limit);

      if (batch.length === 0) break;

      rows.push(...batch);

      if (batch.length < limit) break;

      offset += batch.length;
    }

    await buildPdfTable(res, title, columns, rows);
  }

  private async streamToExcel(
    res: Response,
    sheetName: string,
    columns: ExportColumn[],
    fetchBatch: (
      offset: number,
      limit: number
    ) => Promise<Record<string, unknown>[]>,
    maxRows: number
  ): Promise<void> {
    const passThrough = new PassThrough();
    passThrough.pipe(res);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: passThrough,
    });
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns.map(({ key, width }) => ({ key, width }));

    const headerRow = worksheet.addRow(columns.map((c) => c.header));
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.border = BORDER_STYLE;
      cell.fill = HEADER_FILL;
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
    });
    headerRow.commit();

    let offset = 0;
    let totalWritten = 0;

    while (totalWritten < maxRows) {
      const remaining = maxRows - totalWritten;
      const limit = Math.min(BATCH_SIZE, remaining);
      const batch = await fetchBatch(offset, limit);

      if (batch.length === 0) break;

      for (const item of batch) {
        const row = worksheet.addRow(item);
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = BORDER_STYLE;
          const colDef = columns[colNumber - 1];
          if (colDef?.numFmt) {
            cell.numFmt = colDef.numFmt;
          }
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true,
          };
        });

        let maxLines = 1;
        row.eachCell({ includeEmpty: true }, (cell) => {
          const rawValue = cell.value;
          let value = '';
          if (rawValue !== null && rawValue !== undefined) {
            if (typeof rawValue === 'object') {
              if ('text' in rawValue && typeof rawValue.text === 'string') {
                value = rawValue.text;
              } else if (
                'result' in rawValue &&
                (typeof rawValue.result === 'string' ||
                  typeof rawValue.result === 'number')
              ) {
                value = String(rawValue.result);
              } else {
                value = JSON.stringify(rawValue);
              }
            } else {
              value = String(rawValue);
            }
          }
          const lines = value.split(/\r?\n/).length;

          const approx = Math.ceil(value.length / 40);
          maxLines = Math.max(maxLines, Math.max(lines, approx));
        });
        row.height = 13 * maxLines;
        row.commit();
      }

      totalWritten += batch.length;
      if (batch.length < limit) break;
      offset += batch.length;
    }

    worksheet.commit();
    await workbook.commit();
  }

  private async fetchBatch<T extends object>(
    qb: SelectQueryBuilder<T>,
    offset: number,
    limit: number,
    mapper: (entity: T) => Record<string, unknown>
  ): Promise<Record<string, unknown>[]> {
    qb.skip(offset).take(limit);
    const items = await qb.getMany();
    return items.map(mapper);
  }

  private buildProductoQueryBuilder(
    query: ExportProductoFilterDto
  ): SelectQueryBuilder<Producto> {
    const qb = this.dataSource
      .createQueryBuilder(Producto, 'producto')
      .leftJoinAndSelect('producto.proveedores', 'proveedores')
      .leftJoinAndSelect('proveedores.proveedor', 'proveedor')
      .leftJoinAndSelect('producto.alergenos', 'alergenos');

    if (query.codigoBarras) {
      qb.andWhere('producto.codigoBarras = :codigoBarras', {
        codigoBarras: query.codigoBarras,
      });
    } else if (query.searchTerm) {
      qb.andWhere('producto.nombre ILIKE :searchTerm', {
        searchTerm: `%${query.searchTerm}%`,
      });
    }

    if (query.categorias && query.categorias.length > 0) {
      qb.andWhere('producto.tipo IN (:...categorias)', {
        categorias: query.categorias,
      });
    }

    if (query.marcas && query.marcas.length > 0) {
      qb.andWhere('producto.marca IN (:...marcas)', { marcas: query.marcas });
    }

    if (query.alergenos && query.alergenos.length > 0) {
      qb.innerJoin(
        'producto.alergenos',
        'alergenoFiltro',
        'alergenoFiltro.alergeno IN (:...alergenos)',
        { alergenos: query.alergenos }
      );
    }

    if (query.minStock) {
      qb.innerJoin(
        'proveedores.inventarios',
        'inventarios',
        'inventarios.cantidad_actual > 0'
      );
    }

    qb.orderBy('producto.nombre', 'ASC');
    return qb;
  }

  private buildPedidoQueryBuilder(
    query: ExportPedidoFilterDto
  ): SelectQueryBuilder<Pedido> {
    const qb = this.dataSource
      .createQueryBuilder(Pedido, 'pedido')
      .leftJoinAndSelect('pedido.usuario', 'usuario')
      .leftJoinAndSelect('pedido.proveedor', 'proveedor')
      .leftJoinAndSelect('pedido.pedidoProductos', 'pedidoProductos');

    if (query.estado) {
      qb.andWhere('pedido.estado = :estado', { estado: query.estado });
    }

    if (query.fechaDesde) {
      qb.andWhere('pedido.fechaPedido >= :fechaDesde', {
        fechaDesde: query.fechaDesde,
      });
    }

    if (query.fechaHasta) {
      qb.andWhere('pedido.fechaPedido <= :fechaHasta', {
        fechaHasta: query.fechaHasta,
      });
    }

    if (query.searchTerm) {
      qb.andWhere('proveedor.nombre ILIKE :searchTerm', {
        searchTerm: `%${query.searchTerm}%`,
      });
    }

    qb.orderBy('pedido.fechaPedido', 'DESC');
    return qb;
  }

  private buildProveedorQueryBuilder(
    query: ExportProveedorFilterDto
  ): SelectQueryBuilder<Proveedor> {
    const qb = this.dataSource.createQueryBuilder(Proveedor, 'proveedor');

    if (query.searchTerm) {
      qb.where(
        '(proveedor.nombre ILIKE :search OR proveedor.nif ILIKE :search OR proveedor.contacto ILIKE :search OR proveedor.email ILIKE :search)',
        { search: `%${query.searchTerm}%` }
      );
    }

    qb.orderBy('proveedor.nombre', 'ASC');
    return qb;
  }

  private buildAlbaranQueryBuilder(
    query: ExportAlbaranFilterDto
  ): SelectQueryBuilder<Albaran> {
    const qb = this.dataSource
      .createQueryBuilder(Albaran, 'albaran')
      .leftJoinAndSelect('albaran.albaranPedidoRecepcion', 'apr');

    if (query.searchTerm) {
      qb.andWhere('albaran.nAlbaran ILIKE :search', {
        search: `%${query.searchTerm}%`,
      });
    }

    if (query.fechaDesde) {
      qb.andWhere('albaran.fecha >= :fechaDesde', {
        fechaDesde: query.fechaDesde,
      });
    }

    if (query.fechaHasta) {
      qb.andWhere('albaran.fecha <= :fechaHasta', {
        fechaHasta: query.fechaHasta,
      });
    }

    qb.orderBy('albaran.fecha', 'DESC');
    return qb;
  }

  private buildIncidenciaQueryBuilder(
    query: ExportIncidenciaFilterDto
  ): SelectQueryBuilder<Incidencia> {
    const qb = this.dataSource
      .createQueryBuilder(Incidencia, 'incidencia')
      .leftJoinAndSelect('incidencia.pedido', 'pedido')
      .leftJoinAndSelect('pedido.proveedor', 'proveedor')
      .leftJoinAndSelect('incidencia.usuarioResolutor', 'usuarioResolutor')
      .leftJoinAndSelect('incidencia.lineas', 'lineas');

    if (query.resuelta === true) {
      qb.andWhere('incidencia.fechaResolucion IS NOT NULL');
    } else if (query.resuelta === false) {
      qb.andWhere('incidencia.fechaResolucion IS NULL');
    }

    qb.orderBy('incidencia.createdAt', 'DESC');
    return qb;
  }

  private buildInventarioQueryBuilder(
    query: ExportInventarioFilterDto
  ): SelectQueryBuilder<Inventario> {
    const qb = this.dataSource
      .createQueryBuilder(Inventario, 'inventario')
      .leftJoinAndSelect('inventario.productoProveedor', 'pp')
      .leftJoinAndSelect('pp.producto', 'producto')
      .leftJoinAndSelect('pp.proveedor', 'proveedor')
      .leftJoinAndSelect('inventario.ubicacion', 'ubicacion');

    if (query.bajoStock) {
      qb.andWhere('inventario.cantidadActual < inventario.cantidadMinima');
    }

    if (query.searchTerm) {
      qb.andWhere('producto.nombre ILIKE :search', {
        search: `%${query.searchTerm}%`,
      });
    }

    if (query.ubicacionId) {
      qb.andWhere('ubicacion.id = :ubicacionId', {
        ubicacionId: query.ubicacionId,
      });
    }

    qb.orderBy('producto.nombre', 'ASC');
    return qb;
  }

  private buildMovimientoQueryBuilder(
    query: ExportMovimientoFilterDto
  ): SelectQueryBuilder<Movimiento> {
    const qb = this.dataSource
      .createQueryBuilder(Movimiento, 'movimiento')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .leftJoinAndSelect('movimiento.productoProveedor', 'productoProveedor')
      .leftJoinAndSelect('productoProveedor.producto', 'producto');

    if (query.tipo) {
      qb.andWhere('movimiento.tipo = :tipo', { tipo: query.tipo });
    }

    if (query.fechaDesde) {
      qb.andWhere('movimiento.createdAt >= :fechaDesde', {
        fechaDesde: query.fechaDesde,
      });
    }

    if (query.fechaHasta) {
      qb.andWhere('movimiento.createdAt <= :fechaHasta', {
        fechaHasta: query.fechaHasta,
      });
    }

    qb.orderBy('movimiento.createdAt', 'DESC');
    return qb;
  }

  private buildRecepcionQueryBuilder(
    query: ExportRecepcionFilterDto
  ): SelectQueryBuilder<Recepcion> {
    const qb = this.dataSource
      .createQueryBuilder(Recepcion, 'recepcion')
      .leftJoinAndSelect('recepcion.usuario', 'usuario')
      .leftJoinAndSelect('recepcion.recepcionesPedidos', 'recepcionesPedidos');

    if (query.estado) {
      qb.andWhere('recepcion.estado = :estado', { estado: query.estado });
    }

    if (query.fechaDesde) {
      qb.andWhere('recepcion.fechaRecepcion >= :fechaDesde', {
        fechaDesde: query.fechaDesde,
      });
    }

    if (query.fechaHasta) {
      qb.andWhere('recepcion.fechaRecepcion <= :fechaHasta', {
        fechaHasta: query.fechaHasta,
      });
    }

    qb.orderBy('recepcion.fechaRecepcion', 'DESC');
    return qb;
  }

  private buildRecetaQueryBuilder(
    query: ExportRecetaFilterDto
  ): SelectQueryBuilder<Receta> {
    const qb = this.dataSource
      .createQueryBuilder(Receta, 'receta')
      .leftJoinAndSelect('receta.ingredientes', 'ingredientes')
      .leftJoinAndSelect('ingredientes.producto', 'producto');

    if (query.searchTerm) {
      qb.andWhere('receta.nombre ILIKE :search', {
        search: `%${query.searchTerm}%`,
      });
    }

    if (query.dificultad) {
      qb.andWhere('receta.dificultad = :dificultad', {
        dificultad: query.dificultad,
      });
    }

    if (query.maxTiempoMinutos) {
      qb.andWhere('receta.tiempoEstimadoMinutos <= :maxTiempoMinutos', {
        maxTiempoMinutos: query.maxTiempoMinutos,
      });
    }

    qb.orderBy('receta.nombre', 'ASC');
    return qb;
  }

  private buildUbicacionQueryBuilder(
    query: ExportUbicacionFilterDto
  ): SelectQueryBuilder<Ubicacion> {
    const qb = this.dataSource.createQueryBuilder(Ubicacion, 'ubicacion');

    if (query.searchTerm) {
      qb.where(
        '(ubicacion.nombre ILIKE :search OR ubicacion.descripcion ILIKE :search)',
        { search: `%${query.searchTerm}%` }
      );
    }

    qb.orderBy('ubicacion.nombre', 'ASC');
    return qb;
  }

  private buildUsuarioQueryBuilder(
    query: ExportUsuarioFilterDto
  ): SelectQueryBuilder<Usuario> {
    const qb = this.dataSource
      .createQueryBuilder(Usuario, 'usuario')
      .leftJoinAndSelect('usuario.profesor', 'profesor')
      .select([
        'usuario.id',
        'usuario.nombre',
        'usuario.username',
        'usuario.email',
        'usuario.rol',
        'usuario.activo',
        'usuario.createdAt',
        'profesor.id',
        'profesor.cial',
      ]);

    if (query.searchTerm) {
      qb.andWhere(
        '(usuario.nombre ILIKE :search OR usuario.email ILIKE :search OR usuario.username ILIKE :search)',
        { search: `%${query.searchTerm}%` }
      );
    }

    if (query.rol) {
      qb.andWhere('usuario.rol = :rol', { rol: query.rol });
    }

    if (query.activo !== undefined) {
      qb.andWhere('usuario.activo = :activo', { activo: query.activo });
    }

    qb.orderBy('usuario.nombre', 'ASC');
    return qb;
  }
}
