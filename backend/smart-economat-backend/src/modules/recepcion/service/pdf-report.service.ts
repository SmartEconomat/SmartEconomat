import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import {
  RecepcionReportePdfDto,
  TipoReportePdf,
} from '../dto/recepcion-reporte-pdf.dto';
import { EstadoPedido } from '../../pedido/enums/estado-pedido.enum';

/** Constantes públicas (IVA_RATE) expuestas en smart-economat-backend (Nest). */
export const IVA_RATE = 0.1;

const MARGIN = 40;
const ROW_H = 18;
const HEADER_H = 24;
const FONT_BODY = 8;
const FONT_HEADER = 8;
const FONT_TITLE = 16;
const FONT_SECTION = 11;
const FONT_SUMMARY = 9;
const C_BLUE = '#4472C4';
const C_BLUE_DARK = '#1F4E79';
const C_RED_DARK = '#7B2020';
const C_RED = '#C0392B';
const C_SECTION_BG = '#E8EEFA';
const C_ROW_ALT_BLUE = '#F0F4FA';
const C_ROW_ALT_RED = '#FEF0F0';
const C_TOTAL_BG = '#D6E4F0';
const C_BORDER = '#CCCCCC';
const C_WHITE = '#FFFFFF';
const C_TEXT = '#222222';
const C_GRAY = '#555555';

/** Contrato de tipos público (LineaPedidoAgrupada). Contexto: smart-economat-backend (Nest). */
export interface LineaPedidoAgrupada {
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/** Contrato de tipos público (PedidoAgrupado). Contexto: smart-economat-backend (Nest). */
export interface PedidoAgrupado {
  id: string;
  numeroGlobal?: string;
  fecha: Date;
  estado: EstadoPedido;
  motivoCancelacion?: string;
  lineas: LineaPedidoAgrupada[];
  subtotalPedido: number;
}

/** Contrato de tipos público (ProveedorGroup). Contexto: smart-economat-backend (Nest). */
export interface ProveedorGroup {
  nombre: string;
  nif?: string;
  pedidos: PedidoAgrupado[];
  subtotal: number;
  iva: number;
  total: number;
}

/** Contrato de tipos público (LineaIncidenciaAgrupada). Contexto: smart-economat-backend (Nest). */
export interface LineaIncidenciaAgrupada {
  incidenciaId: string;
  pedidoId?: string;
  fechaIncidencia: Date;
  producto: string;
  cantidadPedida: number;
  cantidadRecibida: number;
  diferencia: number;
  tipoDiferencia: string;
  estadoReclamacion: string;
  resuelta: boolean;
}

/** Contrato de tipos público (ProveedorIncidenciaGroup). Contexto: smart-economat-backend (Nest). */
export interface ProveedorIncidenciaGroup {
  nombre: string;
  nif?: string;
  lineas: LineaIncidenciaAgrupada[];
}

/**
 * Servicio de dominio para pdf report.
 */
@Injectable()
export class PdfReportService {
  private readonly logger = new Logger(PdfReportService.name);

  private readonly docConfig = {
    autoFirstPage: false,
    size: 'A4' as const,
    layout: 'landscape' as const,
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
  };

  /**
   * Construye la instancia configurada.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  /**
   * Genera artefactos sintéticos a partir del estado conocido.
   * @undefined {RecepcionReportePdfDto} filters - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async generateReport(
    filters: RecepcionReportePdfDto,
    res: Response
  ): Promise<void> {
    if (filters.tipo === TipoReportePdf.PEDIDO) {
      await this.generatePedidoReport(filters, res);
    } else if (filters.tipo === TipoReportePdf.RECEPCION) {
      if (!filters.recepcionId) {
        throw new BadRequestException(
          'recepcionId es obligatorio para este tipo de reporte.'
        );
      }
      await this.generateSingleRecepcionReport(filters.recepcionId, res);
    } else {
      await this.generateIncidenciasReport(filters, res);
    }
  }

  /**
   * Genera artefactos sintéticos a partir del estado conocido.
   * @undefined {RecepcionReportePdfDto} filters - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async generatePedidoReport(
    filters: RecepcionReportePdfDto,
    res: Response
  ): Promise<void> {
    this.logger.debug(
      `generatePedidoReport: filters=${JSON.stringify(filters)}`
    );

    const isTrue = (val: any) => val === true || val === 'true';

    const incluirCancelados = isTrue(filters.incluirCancelados);
    const paginaPorProveedor = isTrue(filters.paginaPorProveedor);

    const qb = this.dataSource
      .createQueryBuilder(Pedido, 'pedido')
      .leftJoinAndSelect('pedido.proveedor', 'proveedor')
      .leftJoinAndSelect('pedido.pedidoProductos', 'lineas')
      .leftJoinAndSelect('lineas.productoProveedor', 'pp')
      .leftJoinAndSelect('pp.producto', 'producto')
      .orderBy('proveedor.nombre', 'ASC')
      .addOrderBy('pedido.fechaPedido', 'DESC');

    if (filters.pedidoId) {
      qb.andWhere('pedido.id = :pedidoId', { pedidoId: filters.pedidoId });
    }
    if (filters.proveedorId) {
      qb.andWhere('pedido.proveedorId = :proveedorId', {
        proveedorId: filters.proveedorId,
      });
    }
    if (filters.startDate) {
      qb.andWhere('pedido.fechaPedido >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters.endDate) {
      qb.andWhere('pedido.fechaPedido <= :endDate', {
        endDate: filters.endDate,
      });
    }
    if (filters.batchId) {
      qb.andWhere('pedido.batchId = :batchId', {
        batchId: filters.batchId,
      });
    }
    if (filters.pedidoUsuarioId) {
      qb.andWhere('pedido.pedidoUsuarioId = :pedidoUsuarioId', {
        pedidoUsuarioId: filters.pedidoUsuarioId,
      });
    }
    if (!incluirCancelados) {
      qb.andWhere('pedido.estado != :cancelado', {
        cancelado: EstadoPedido.CANCELADO,
      });
    }

    const pedidos = await qb.getMany();
    this.logger.debug(
      `generatePedidoReport: pedidos found=${pedidos.length}, inclusionCancelados=${incluirCancelados}`
    );

    if (pedidos.length === 0) {
      throw new BadRequestException(
        'No se encontraron pedidos con los filtros indicados.'
      );
    }

    const groups = this.groupPedidosByProveedor(pedidos);
    await this.buildPedidoPdf(groups, res, paginaPorProveedor);
  }

  /**
   * Genera artefactos sintéticos a partir del estado conocido.
   * @undefined {RecepcionReportePdfDto} filters - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async generateIncidenciasReport(
    filters: RecepcionReportePdfDto,
    res: Response
  ): Promise<void> {
    const qb = this.dataSource
      .createQueryBuilder(Incidencia, 'incidencia')
      .leftJoinAndSelect('incidencia.pedido', 'pedido')
      .leftJoinAndSelect('pedido.proveedor', 'proveedor')
      .leftJoinAndSelect('incidencia.lineas', 'lineas')
      .leftJoinAndSelect('lineas.pedidoProducto', 'pedidoProducto')
      .leftJoinAndSelect('pedidoProducto.productoProveedor', 'pp')
      .leftJoinAndSelect('pp.producto', 'producto')
      .orderBy('proveedor.nombre', 'ASC')
      .addOrderBy('incidencia.createdAt', 'DESC');

    const soloNoResueltas =
      filters.soloNoResueltas === true ||
      String(filters.soloNoResueltas) === 'true';
    if (soloNoResueltas) {
      qb.andWhere('incidencia.fechaResolucion IS NULL');
    }
    if (filters.startDate) {
      qb.andWhere('incidencia.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters.endDate) {
      qb.andWhere('incidencia.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }
    if (filters.proveedorId) {
      qb.andWhere('pedido.proveedorId = :proveedorId', {
        proveedorId: filters.proveedorId,
      });
    }
    if (filters.tipoDiferencia) {
      qb.andWhere('lineas.tipoDiferencia = :tipoDiferencia', {
        tipoDiferencia: filters.tipoDiferencia,
      });
    }

    const incidencias = await qb.getMany();

    if (incidencias.length === 0) {
      throw new BadRequestException(
        'No se encontraron incidencias con los filtros indicados.'
      );
    }

    const groups = this.groupIncidenciasByProveedor(incidencias);
    await this.buildIncidenciasPdf(groups, res);
  }

  /**
   * Expone "groupPedidosByProveedor" en smart-economat-backend (Nest).
   * @undefined {Pedido[]} pedidos - Entrada efectiva esperada por el contrato.
   * @undefined {ProveedorGroup[]} Datos efectivos después de ejecutar la operación.
   */
  groupPedidosByProveedor(pedidos: Pedido[]): ProveedorGroup[] {
    const map = new Map<string, ProveedorGroup>();

    for (const pedido of pedidos) {
      const key = pedido.proveedorId ?? 'sin_proveedor';
      if (!map.has(key)) {
        map.set(key, {
          nombre: pedido.proveedor?.nombre ?? 'Sin proveedor',
          nif: pedido.proveedor?.nif,
          pedidos: [],
          subtotal: 0,
          iva: 0,
          total: 0,
        });
      }

      const group = map.get(key)!;
      const lineas = (pedido.pedidoProductos ?? []).map((pp) => {
        const cant = Number(pp.cantidad);
        const precio = Number(pp.precioUnitario);
        return {
          producto: pp.productoProveedor?.producto?.nombre ?? '-',
          cantidad: cant,
          precioUnitario: precio,
          subtotal: cant * precio,
        };
      });

      const subtotalPedido = lineas.reduce((sum, l) => sum + l.subtotal, 0);
      group.pedidos.push({
        id: pedido.id,
        numeroGlobal: pedido.numeroGlobal,
        fecha: pedido.fechaPedido,
        estado: pedido.estado,
        motivoCancelacion: pedido.motivoCancelacion,
        lineas,
        subtotalPedido,
      });
      group.subtotal += subtotalPedido;
    }

    for (const group of map.values()) {
      group.iva = group.subtotal * IVA_RATE;
      group.total = group.subtotal + group.iva;
    }

    return Array.from(map.values());
  }

  private groupIncidenciasByProveedor(
    incidencias: Incidencia[]
  ): ProveedorIncidenciaGroup[] {
    const map = new Map<string, ProveedorIncidenciaGroup>();

    for (const inc of incidencias) {
      const key = inc.pedido?.proveedorId ?? inc.pedidoId ?? 'sin_proveedor';
      if (!map.has(key)) {
        map.set(key, {
          nombre: inc.pedido?.proveedor?.nombre ?? 'Sin proveedor',
          nif: inc.pedido?.proveedor?.nif,
          lineas: [],
        });
      }

      const group = map.get(key)!;
      for (const linea of inc.lineas ?? []) {
        group.lineas.push({
          incidenciaId: inc.id,
          pedidoId: inc.pedidoId,
          fechaIncidencia: inc.createdAt,
          producto:
            linea.pedidoProducto?.productoProveedor?.producto?.nombre ?? '-',
          cantidadPedida: Number(linea.cantidadPedida),
          cantidadRecibida: Number(linea.cantidadRecibida),
          diferencia: Number(linea.diferencia),
          tipoDiferencia: linea.tipoDiferencia,
          estadoReclamacion: linea.estadoReclamacion,
          resuelta: inc.estaResuelta(),
        });
      }
    }

    return Array.from(map.values());
  }

  private buildPedidoPdf(
    groups: ProveedorGroup[],
    res: Response,
    paginaPorProveedor = false
  ): Promise<void> {
    this.logger.debug(
      `buildPedidoPdf: starting for ${groups.length} groups, paginaPorProveedor=${paginaPorProveedor}`
    );

    const forceNewPageByGroup =
      paginaPorProveedor === true || String(paginaPorProveedor) === 'true';
    return new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument(this.docConfig);
      let pageNum = 0;

      doc.on('pageAdded', () => {
        pageNum++;
        const w = doc.page.width;
        const h = doc.page.height;
        const footerY = h - MARGIN - 10;
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor(C_GRAY)
          .text(
            `SmartEconomat — Informe de Pedidos | Pág. ${pageNum} | ${new Date().toLocaleDateString('es-ES')}`,
            MARGIN,
            footerY,
            {
              width: w - MARGIN * 2,
              align: 'center',
              lineBreak: false,
            }
          );
      });

      doc.on('end', resolve);
      doc.on('error', reject);
      doc.pipe(res);
      doc.addPage();

      const usableW = doc.page.width - MARGIN * 2;
      const pageBottom = doc.page.height - MARGIN - 16;
      let y = MARGIN;

      doc.font('Helvetica-Bold').fontSize(FONT_TITLE).fillColor(C_BLUE_DARK);
      doc.text('Informe de Pedidos por Proveedor', MARGIN, y);
      y = doc.y + 4;

      doc.font('Helvetica').fontSize(FONT_BODY).fillColor(C_GRAY);
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} | IVA aplicado: ${(IVA_RATE * 100).toFixed(0)}%`,
        MARGIN,
        y
      );
      y = doc.y + 12;

      const colW = [
        usableW * 0.45,
        usableW * 0.15,
        usableW * 0.2,
        usableW * 0.2,
      ];
      const colHeaders = [
        'Producto',
        'Cantidad',
        'Precio Unit. (€)',
        'Subtotal (€)',
      ];

      const ensureSpace = (h: number) => {
        if (y + h > pageBottom) {
          this.logger.debug(
            `ensureSpace: page jump (y=${y.toFixed(0)}, h=${h}, bottom=${pageBottom.toFixed(0)})`
          );
          doc.addPage();
          y = MARGIN;
        }
      };

      const drawLineHeader = (sy: number): number => {
        doc.rect(MARGIN, sy, usableW, HEADER_H).fill(C_BLUE);
        doc.fillColor(C_WHITE).font('Helvetica-Bold').fontSize(FONT_HEADER);
        let x = MARGIN;
        for (let i = 0; i < colHeaders.length; i++) {
          doc.text(colHeaders[i], x + 4, sy + 7, {
            width: colW[i] - 8,
            lineBreak: false,
            ellipsis: true,
          });
          x += colW[i];
        }
        doc.rect(MARGIN, sy, usableW, HEADER_H).stroke(C_BORDER);
        return sy + HEADER_H;
      };

      const drawLineRow = (
        row: LineaPedidoAgrupada,
        sy: number,
        even: boolean
      ): number => {
        if (even) doc.rect(MARGIN, sy, usableW, ROW_H).fill(C_ROW_ALT_BLUE);
        doc.fillColor(C_TEXT).font('Helvetica').fontSize(FONT_BODY);
        const fmt = (n: number, d: number) =>
          n.toLocaleString('es-ES', {
            minimumFractionDigits: d,
            maximumFractionDigits: d,
          });
        const vals = [
          row.producto,
          fmt(row.cantidad, 3),
          fmt(row.precioUnitario, 4),
          fmt(row.subtotal, 2),
        ];
        let x = MARGIN;
        for (let i = 0; i < vals.length; i++) {
          doc.text(vals[i], x + 4, sy + 4, {
            width: colW[i] - 8,
            lineBreak: false,
            ellipsis: true,
          });
          x += colW[i];
        }
        doc.rect(MARGIN, sy, usableW, ROW_H).stroke(C_BORDER);
        return sy + ROW_H;
      };

      let grandSubtotal = 0;
      let grandTotal = 0;

      for (let i_group = 0; i_group < groups.length; i_group++) {
        const group = groups[i_group];

        if (forceNewPageByGroup && i_group > 0) {
          doc.addPage();
          y = MARGIN;
        } else {
          ensureSpace(HEADER_H + ROW_H * 2 + 20);
        }

        doc.rect(MARGIN, y, usableW, HEADER_H).fill(C_SECTION_BG);
        doc
          .fillColor(C_BLUE_DARK)
          .font('Helvetica-Bold')
          .fontSize(FONT_SECTION);
        doc.text(
          `Proveedor: ${group.nombre}${group.nif ? ` | NIF: ${group.nif}` : ''}`,
          MARGIN + 8,
          y + 6
        );
        doc.rect(MARGIN, y, usableW, HEADER_H).stroke('#AAAAAA');
        y += HEADER_H + 4;

        for (const pedido of group.pedidos) {
          ensureSpace(HEADER_H + ROW_H + 28);

          doc
            .fillColor('#333333')
            .font('Helvetica-BoldOblique')
            .fontSize(FONT_SUMMARY);
          const pedidoLabel = pedido.numeroGlobal
            ? `Pedido #${pedido.numeroGlobal}`
            : `Pedido ${pedido.id.slice(0, 8)}…`;
          doc.text(
            `${pedidoLabel} | Fecha: ${pedido.fecha.toLocaleDateString('es-ES')} | Estado: ${pedido.estado}`,
            MARGIN + 4,
            y
          );
          y = doc.y + 4;

          if (
            pedido.estado === EstadoPedido.CANCELADO &&
            pedido.motivoCancelacion
          ) {
            ensureSpace(ROW_H + 10);
            doc
              .fillColor(C_RED)
              .font('Helvetica-Bold')
              .fontSize(FONT_BODY - 1);
            doc.text(
              `* MOTIVO CANCELACIÓN: ${pedido.motivoCancelacion}`,
              MARGIN + 4,
              y
            );
            y = doc.y + 6;
          }

          y = drawLineHeader(y);

          for (let i = 0; i < pedido.lineas.length; i++) {
            ensureSpace(ROW_H);
            y = drawLineRow(pedido.lineas[i], y, i % 2 === 0);
          }

          doc
            .fillColor('#444444')
            .font('Helvetica-Bold')
            .fontSize(FONT_SUMMARY);
          doc.text(
            `Subtotal pedido: ${pedido.subtotalPedido.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
            MARGIN,
            y + 4,
            { align: 'right', width: usableW }
          );
          y = doc.y + 8;
        }

        ensureSpace(ROW_H * 2 + 8);
        doc.rect(MARGIN, y, usableW, ROW_H * 2 + 4).fill(C_TOTAL_BG);
        doc
          .fillColor(C_BLUE_DARK)
          .font('Helvetica-Bold')
          .fontSize(FONT_SUMMARY);
        const fmt2 = (n: number) =>
          n.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        doc.text(
          `TOTAL PROVEEDOR — Subtotal: ${fmt2(group.subtotal)} €  |  IVA (${(IVA_RATE * 100).toFixed(0)}%): ${fmt2(group.iva)} €  |  TOTAL: ${fmt2(group.total)} €`,
          MARGIN + 8,
          y + 7,
          { width: usableW - 16 }
        );
        doc.rect(MARGIN, y, usableW, ROW_H * 2 + 4).stroke('#AAAAAA');
        y += ROW_H * 2 + 4 + 16;

        grandSubtotal += group.subtotal;
        grandTotal += group.total;
      }

      ensureSpace(HEADER_H + 8);
      doc.rect(MARGIN, y, usableW, HEADER_H).fill(C_BLUE);
      doc.fillColor(C_WHITE).font('Helvetica-Bold').fontSize(FONT_SECTION);
      const grandIva = grandTotal - grandSubtotal;
      const fmt3 = (n: number) =>
        n.toLocaleString('es-ES', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      doc.text(
        `TOTAL GENERAL — Subtotal: ${fmt3(grandSubtotal)} €  |  IVA: ${fmt3(grandIva)} €  |  TOTAL: ${fmt3(grandTotal)} €`,
        MARGIN + 8,
        y + 6,
        { width: usableW - 16 }
      );
      doc.rect(MARGIN, y, usableW, HEADER_H).stroke(C_BORDER);

      doc.end();
    });
  }

  private buildIncidenciasPdf(
    groups: ProveedorIncidenciaGroup[],
    res: Response
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument(this.docConfig);
      let pageNum = 0;

      doc.on('pageAdded', () => {
        pageNum++;
        const w = doc.page.width;
        const h = doc.page.height;
        const footerY = h - MARGIN - 10;
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor(C_GRAY)
          .text(
            `SmartEconomat — Informe de Incidencias | Pág. ${pageNum} | ${new Date().toLocaleDateString('es-ES')}`,
            MARGIN,
            footerY,
            {
              width: w - MARGIN * 2,
              align: 'center',
              lineBreak: false,
            }
          );
      });

      doc.on('end', resolve);
      doc.on('error', reject);
      doc.pipe(res);
      doc.addPage();

      const usableW = doc.page.width - MARGIN * 2;
      const pageBottom = doc.page.height - MARGIN - 16;
      let y = MARGIN;

      doc.font('Helvetica-Bold').fontSize(FONT_TITLE).fillColor(C_RED_DARK);
      doc.text('Informe de Incidencias — Productos No Óptimos', MARGIN, y);
      y = doc.y + 4;

      doc.font('Helvetica').fontSize(FONT_BODY).fillColor(C_GRAY);
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        MARGIN,
        y
      );
      y = doc.y + 12;

      const colW = [
        usableW * 0.18,
        usableW * 0.12,
        usableW * 0.1,
        usableW * 0.1,
        usableW * 0.1,
        usableW * 0.12,
        usableW * 0.14,
        usableW * 0.14,
      ];
      const colHeaders = [
        'Producto',
        'Pedido',
        'Esperado',
        'Recibido',
        'Diferencia',
        'Tipo',
        'Estado Reclam.',
        'Fecha',
      ];

      const ensureSpace = (h: number) => {
        if (y + h > pageBottom) {
          doc.addPage();
          y = MARGIN;
        }
      };

      const drawIncHeader = (sy: number): number => {
        doc.rect(MARGIN, sy, usableW, HEADER_H).fill(C_RED);
        doc.fillColor(C_WHITE).font('Helvetica-Bold').fontSize(FONT_HEADER);
        let x = MARGIN;
        for (let i = 0; i < colHeaders.length; i++) {
          doc.text(colHeaders[i], x + 3, sy + 7, {
            width: colW[i] - 6,
            lineBreak: false,
            ellipsis: true,
          });
          x += colW[i];
        }
        doc.rect(MARGIN, sy, usableW, HEADER_H).stroke(C_BORDER);
        return sy + HEADER_H;
      };

      const drawIncRow = (
        row: LineaIncidenciaAgrupada,
        sy: number,
        even: boolean
      ): number => {
        if (even) doc.rect(MARGIN, sy, usableW, ROW_H).fill(C_ROW_ALT_RED);
        doc.fillColor(C_TEXT).font('Helvetica').fontSize(FONT_BODY);
        const fmt = (n: number) =>
          n.toLocaleString('es-ES', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          });
        const fechaStr =
          row.fechaIncidencia instanceof Date
            ? row.fechaIncidencia.toLocaleDateString('es-ES')
            : '-';
        const vals = [
          row.producto,
          row.pedidoId ? row.pedidoId.slice(0, 8) + '…' : '-',
          fmt(row.cantidadPedida),
          fmt(row.cantidadRecibida),
          fmt(row.diferencia),
          row.tipoDiferencia,
          row.estadoReclamacion,
          fechaStr,
        ];
        let x = MARGIN;
        for (let i = 0; i < vals.length; i++) {
          doc.text(vals[i], x + 3, sy + 4, {
            width: colW[i] - 6,
            lineBreak: false,
            ellipsis: true,
          });
          x += colW[i];
        }
        doc.rect(MARGIN, sy, usableW, ROW_H).stroke(C_BORDER);
        return sy + ROW_H;
      };

      for (const group of groups) {
        ensureSpace(HEADER_H + ROW_H + 20);

        doc.rect(MARGIN, y, usableW, HEADER_H).fill(C_SECTION_BG);
        doc.fillColor(C_RED_DARK).font('Helvetica-Bold').fontSize(FONT_SECTION);
        doc.text(
          `Proveedor: ${group.nombre}${group.nif ? ` | NIF: ${group.nif}` : ''}`,
          MARGIN + 8,
          y + 6
        );
        doc.rect(MARGIN, y, usableW, HEADER_H).stroke('#AAAAAA');
        y += HEADER_H + 4;

        y = drawIncHeader(y);

        for (let i = 0; i < group.lineas.length; i++) {
          ensureSpace(ROW_H);
          y = drawIncRow(group.lineas[i], y, i % 2 === 0);
        }

        doc.fillColor(C_RED_DARK).font('Helvetica-Bold').fontSize(FONT_SUMMARY);
        doc.text(`Total líneas: ${group.lineas.length}`, MARGIN, y + 4, {
          align: 'right',
          width: usableW,
        });
        y = doc.y + 12;
      }

      doc.end();
    });
  }

  /**
   * Genera artefactos sintéticos a partir del estado conocido.
   * @undefined {string} recepcionId - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async generateSingleRecepcionReport(
    recepcionId: string,
    res: Response
  ): Promise<void> {
    const recepcion = await this.dataSource.getRepository(Recepcion).findOne({
      where: { id: recepcionId },
      relations: [
        'usuario',
        'recepcionesPedidos.pedido.proveedor',
        'recepcionProductos.pedidoProducto.productoProveedor.producto',
        'recepcionProductos.pedidoProducto.productoProveedor.producto',
        'recepcionProductos.incidencia',
      ],
    });

    if (!recepcion) {
      throw new BadRequestException(I18nHelper.getError('RECEPTION_NOT_FOUND'));
    }

    await this.buildRecepcionPdf(recepcion, res);
  }

  private buildRecepcionPdf(
    recepcion: Recepcion,
    res: Response
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument(this.docConfig);
      let pageNum = 0;

      doc.on('pageAdded', () => {
        pageNum++;
        const w = doc.page.width;
        const h = doc.page.height;
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor(C_GRAY)
          .text(
            `SmartEconomat — Comprobante de Recepción | Pág. ${pageNum} | ${new Date(recepcion.fechaRecepcion).toLocaleDateString('es-ES')}`,
            MARGIN,
            h - MARGIN - 10,
            { width: w - MARGIN * 2, align: 'center' }
          );
      });

      doc.on('end', resolve);
      doc.on('error', reject);
      doc.pipe(res);
      doc.addPage();

      const usableW = doc.page.width - MARGIN * 2;
      const pageBottom = doc.page.height - MARGIN - 16;
      let y = MARGIN;

      doc.font('Helvetica-Bold').fontSize(FONT_TITLE).fillColor(C_BLUE_DARK);
      doc.text('Comprobante de Recepción de Mercancía', MARGIN, y);
      y = doc.y + 10;

      doc.font('Helvetica').fontSize(FONT_BODY).fillColor(C_TEXT);
      doc.text(`ID Recepción: ${recepcion.id}`, MARGIN, y);
      doc.text(
        `Fecha: ${new Date(recepcion.fechaRecepcion).toLocaleString('es-ES')}`,
        MARGIN,
        doc.y + 2
      );
      doc.text(
        `Usuario: ${recepcion.usuario?.nombre || 'N/A'}`,
        MARGIN,
        doc.y + 2
      );
      doc.text(`Estado Final: ${recepcion.estado}`, MARGIN, doc.y + 2);
      if (recepcion.observaciones) {
        doc.text(
          `Notas Generales: ${recepcion.observaciones}`,
          MARGIN,
          doc.y + 4,
          { width: usableW }
        );
      }
      y = doc.y + 15;

      const colW = [
        usableW * 0.35,
        usableW * 0.15,
        usableW * 0.15,
        usableW * 0.15,
        usableW * 0.2,
      ];
      const colHeaders = [
        'Producto / Referencia',
        'Cant. Recibida',
        'Unidad',
        'Estado',
        'Incidencia',
      ];

      const drawHeader = (sy: number) => {
        doc.rect(MARGIN, sy, usableW, HEADER_H).fill(C_BLUE);
        doc.fillColor(C_WHITE).font('Helvetica-Bold').fontSize(FONT_HEADER);
        let x = MARGIN;
        colHeaders.forEach((h, i) => {
          doc.text(h, x + 4, sy + 7, { width: colW[i] - 8, lineBreak: false });
          x += colW[i];
        });
        return sy + HEADER_H;
      };

      y = drawHeader(y);

      recepcion.recepcionProductos.forEach((rp, i) => {
        if (y + ROW_H > pageBottom) {
          doc.addPage();
          y = drawHeader(MARGIN);
        }

        if (i % 2 === 0)
          doc.rect(MARGIN, y, usableW, ROW_H).fill(C_ROW_ALT_BLUE);
        doc.fillColor(C_TEXT).font('Helvetica').fontSize(FONT_BODY);

        const prodName =
          rp.pedidoProducto?.productoProveedor?.producto?.nombre ||
          'Producto Desconocido';
        const vals = [
          prodName,
          rp.cantidadRecibida.toString(),
          rp.pedidoProducto?.productoProveedor?.producto?.unidad || '-',
          rp.estadoProducto,
          rp.incidencia ? 'SÍ' : 'NO',
        ];

        let x = MARGIN;
        vals.forEach((v, idx) => {
          doc.text(v, x + 4, y + 5, {
            width: colW[idx] - 8,
            lineBreak: false,
            ellipsis: true,
          });
          x += colW[idx];
        });
        doc.rect(MARGIN, y, usableW, ROW_H).stroke(C_BORDER);
        y += ROW_H;
      });

      doc.end();
    });
  }
}
