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

/**
 * Service responsible for streaming entity data to Excel (XLSX) and PDF formats.
 * Uses batched queries and streaming writers to handle large datasets efficiently.
 * @class ExportService
 */
@Injectable()
export class ExportService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  /**
   * Streams the productos dataset as an Excel file to the HTTP response.
   * @param {ExportProductoFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the pedidos dataset as an Excel file to the HTTP response.
   * @param {ExportPedidoFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the proveedores dataset as an Excel file to the HTTP response.
   * @param {ExportProveedorFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the albaranes dataset as an Excel file to the HTTP response.
   * @param {ExportAlbaranFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the incidencias dataset as an Excel file to the HTTP response.
   * @param {ExportIncidenciaFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the inventario dataset as an Excel file to the HTTP response.
   * @param {ExportInventarioFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the movimientos dataset as an Excel file to the HTTP response.
   * @param {ExportMovimientoFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the recepciones dataset as an Excel file to the HTTP response.
   * @param {ExportRecepcionFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the recetas dataset as an Excel file to the HTTP response.
   * @param {ExportRecetaFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the ubicaciones dataset as an Excel file to the HTTP response.
   * @param {ExportUbicacionFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the usuarios dataset as an Excel file to the HTTP response.
   * @param {ExportUsuarioFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the productos dataset as a PDF file to the HTTP response.
   * @param {ExportProductoFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the proveedores dataset as a PDF file to the HTTP response.
   * @param {ExportProveedorFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the inventario dataset as a PDF file to the HTTP response.
   * @param {ExportInventarioFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the pedidos dataset as a PDF file to the HTTP response.
   * @param {ExportPedidoFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the albaranes dataset as a PDF file to the HTTP response.
   * @param {ExportAlbaranFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Streams the incidencias dataset as a PDF file to the HTTP response.
   * @param {ExportIncidenciaFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
  async streamIncidenciasToPdf(
    query: ExportIncidenciaFilterDto,
    res: Response
  ): Promise<void> {
    await this.streamQueryToPdf(
      res,
      'Incidencias',
      INCIDENCIA_COLUMNS,
      this.buildIncidenciaQueryBuilder(query),
      mapIncidenciaToExcelRow,
      query.maxRows ?? DEFAULT_MAX_ROWS
    );
  }

  /**
   * Streams the recetas dataset as a PDF file to the HTTP response.
   * @param {ExportRecetaFilterDto} query - Filter criteria and optional maxRows limit.
   * @param {Response} res - Express response object used as the write target.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the result set exceeds the allowed row limit.
   */
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

  /**
   * Generic helper that enforces the row limit and then delegates to streamToPdf.
   * @param {Response} res - Express response object.
   * @param {string} title - Title shown in the PDF document.
   * @param {ExportColumn[]} columns - Column definitions (header label + key).
   * @param {SelectQueryBuilder<T>} qb - Pre-configured TypeORM query builder.
   * @param {(entity: T) => Record<string, unknown>} mapper - Maps an entity to a plain row object.
   * @param {number} maxRows - Maximum number of rows to export.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the total row count exceeds maxRows.
   */
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

  /**
   * Generic helper that enforces the row limit and then delegates to streamToExcel.
   * @param {Response} res - Express response object.
   * @param {string} sheetName - Name of the worksheet tab.
   * @param {ExportColumn[]} columns - Column definitions (header label + key).
   * @param {SelectQueryBuilder<T>} qb - Pre-configured TypeORM query builder.
   * @param {(entity: T) => Record<string, unknown>} mapper - Maps an entity to a plain row object.
   * @param {number} maxRows - Maximum number of rows to export.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the total row count exceeds maxRows.
   */
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

  /**
   * Counts total matching rows and throws if the count exceeds the allowed limit.
   * @param {SelectQueryBuilder<T>} qb - Query builder to count against.
   * @param {number} maxRows - The maximum allowed number of rows.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When the count exceeds maxRows.
   */
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

  /**
   * Collects all batches from fetchBatch and delegates to buildPdfTable for rendering.
   * @param {Response} res - Express response object.
   * @param {string} title - Title shown at the top of the PDF.
   * @param {ExportColumn[]} columns - Column definitions used for headers and data mapping.
   * @param {(offset: number, limit: number) => Promise<Record<string, unknown>[]>} fetchBatch - Function that returns a page of rows.
   * @param {number} maxRows - Maximum number of rows to include.
   * @returns {Promise<void>}
   */
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

  /**
   * Streams data to the response as a styled XLSX workbook using batched writes.
   * Applies header styling, borders, column widths, number formats, and auto row height.
   * @param {Response} res - Express response object to pipe the workbook into.
   * @param {string} sheetName - Name of the worksheet tab.
   * @param {ExportColumn[]} columns - Column definitions (header label, key, width, numFmt).
   * @param {(offset: number, limit: number) => Promise<Record<string, unknown>[]>} fetchBatch - Function that returns a page of mapped rows.
   * @param {number} maxRows - Maximum number of data rows to write.
   * @returns {Promise<void>}
   */
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

  /**
   * Fetches a single page of entities from the query builder and maps them to plain objects.
   * @param {SelectQueryBuilder<T>} qb - Query builder to execute (will be mutated with skip/take).
   * @param {number} offset - Number of rows to skip.
   * @param {number} limit - Maximum number of rows to return.
   * @param {(entity: T) => Record<string, unknown>} mapper - Row mapper function.
   * @returns {Promise<Record<string, unknown>[]>} Array of plain row objects.
   */
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

  /**
   * Builds a TypeORM query builder for Producto with optional filters applied.
   * Joins proveedores, proveedor, and alergenos relations.
   * @param {ExportProductoFilterDto} query - Filter options (codigoBarras, searchTerm, categorias, marcas, alergenos, minStock).
   * @returns {SelectQueryBuilder<Producto>} Configured query builder ordered by nombre ASC.
   */
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

  /**
   * Builds a TypeORM query builder for Pedido with optional filters applied.
   * Joins usuario, proveedor, and pedidoProductos relations.
   * @param {ExportPedidoFilterDto} query - Filter options (estado, fechaDesde, fechaHasta, searchTerm).
   * @returns {SelectQueryBuilder<Pedido>} Configured query builder ordered by fechaPedido DESC.
   */
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

  /**
   * Builds a TypeORM query builder for Proveedor with an optional full-text search filter.
   * Searches across nombre, nif, contacto, and email fields.
   * @param {ExportProveedorFilterDto} query - Filter options (searchTerm).
   * @returns {SelectQueryBuilder<Proveedor>} Configured query builder ordered by nombre ASC.
   */
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

  /**
   * Builds a TypeORM query builder for Albaran with optional date range and search filters.
   * Joins albaranPedidoRecepcion relation.
   * @param {ExportAlbaranFilterDto} query - Filter options (searchTerm, fechaDesde, fechaHasta).
   * @returns {SelectQueryBuilder<Albaran>} Configured query builder ordered by fecha DESC.
   */
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

  /**
   * Builds a TypeORM query builder for Incidencia with optional resolution, date, and proveedor filters.
   * Joins pedido, proveedor, usuarioResolutor, and lineas relations.
   * @param {ExportIncidenciaFilterDto} query - Filter options (soloNoResueltas, resuelta, startDate, endDate, proveedorId).
   * @returns {SelectQueryBuilder<Incidencia>} Configured query builder ordered by createdAt DESC.
   */
  private buildIncidenciaQueryBuilder(
    query: ExportIncidenciaFilterDto
  ): SelectQueryBuilder<Incidencia> {
    const qb = this.dataSource
      .createQueryBuilder(Incidencia, 'incidencia')
      .leftJoinAndSelect('incidencia.pedido', 'pedido')
      .leftJoinAndSelect('pedido.proveedor', 'proveedor')
      .leftJoinAndSelect('incidencia.usuarioResolutor', 'usuarioResolutor')
      .leftJoinAndSelect('incidencia.lineas', 'lineas');

    if (query.soloNoResueltas === true) {
      qb.andWhere('incidencia.fechaResolucion IS NULL');
    } else if (query.resuelta === true) {
      qb.andWhere('incidencia.fechaResolucion IS NOT NULL');
    } else if (query.resuelta === false) {
      qb.andWhere('incidencia.fechaResolucion IS NULL');
    }

    if (query.startDate) {
      const normalizedStartDate =
        query.startDate.length === 10
          ? `${query.startDate}T00:00:00.000Z`
          : query.startDate;

      qb.andWhere('incidencia.createdAt >= :startDate', {
        startDate: normalizedStartDate,
      });
    }

    if (query.endDate) {
      const normalizedEndDate =
        query.endDate.length === 10
          ? `${query.endDate}T23:59:59.999Z`
          : query.endDate;

      qb.andWhere('incidencia.createdAt <= :endDate', {
        endDate: normalizedEndDate,
      });
    }

    if (query.proveedorId) {
      qb.andWhere('pedido.proveedorId = :proveedorId', {
        proveedorId: query.proveedorId,
      });
    }

    qb.orderBy('incidencia.createdAt', 'DESC');
    return qb;
  }

  /**
   * Builds a TypeORM query builder for Inventario with optional stock, search, and location filters.
   * Joins productoProveedor, producto, proveedor, and ubicacion relations.
   * @param {ExportInventarioFilterDto} query - Filter options (bajoStock, searchTerm, ubicacionId).
   * @returns {SelectQueryBuilder<Inventario>} Configured query builder ordered by producto.nombre ASC.
   */
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

  /**
   * Builds a TypeORM query builder for Movimiento with optional type and date range filters.
   * Joins usuario, productoProveedor, and producto relations.
   * @param {ExportMovimientoFilterDto} query - Filter options (tipo, fechaDesde, fechaHasta).
   * @returns {SelectQueryBuilder<Movimiento>} Configured query builder ordered by createdAt DESC.
   */
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

  /**
   * Builds a TypeORM query builder for Recepcion with optional state and date range filters.
   * Joins usuario and recepcionesPedidos relations.
   * @param {ExportRecepcionFilterDto} query - Filter options (estado, fechaDesde, fechaHasta).
   * @returns {SelectQueryBuilder<Recepcion>} Configured query builder ordered by fechaRecepcion DESC.
   */
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

  /**
   * Builds a TypeORM query builder for Receta with optional name, difficulty, and time filters.
   * Joins ingredientes and producto relations.
   * @param {ExportRecetaFilterDto} query - Filter options (searchTerm, dificultad, maxTiempoMinutos).
   * @returns {SelectQueryBuilder<Receta>} Configured query builder ordered by nombre ASC.
   */
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

  /**
   * Builds a TypeORM query builder for Ubicacion with an optional full-text search filter.
   * Searches across nombre and descripcion fields.
   * @param {ExportUbicacionFilterDto} query - Filter options (searchTerm).
   * @returns {SelectQueryBuilder<Ubicacion>} Configured query builder ordered by nombre ASC.
   */
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

  /**
   * Builds a TypeORM query builder for Usuario with optional search, role, and active status filters.
   * Joins the profesor relation and selects only the fields needed for export.
   * @param {ExportUsuarioFilterDto} query - Filter options (searchTerm, rol, activo).
   * @returns {SelectQueryBuilder<Usuario>} Configured query builder ordered by nombre ASC.
   */
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
