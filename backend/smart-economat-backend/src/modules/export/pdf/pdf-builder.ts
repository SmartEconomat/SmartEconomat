import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import type { ExportColumn } from '../mappers/producto-export.mapper';

const PAGE_MARGIN = 40;
const ROW_HEIGHT = 18;
const HEADER_HEIGHT = 24;
const CELL_PAD_X = 4;
const CELL_PAD_Y = 4;
const FONT_SIZE = 7;
const HEADER_FONT_SIZE = 8;
const TITLE_FONT_SIZE = 16;
const SUMMARY_FONT_SIZE = 9;
const HEADER_FILL = '#E8EEFA';
const EVEN_ROW_FILL = '#F0F4FA';
const BORDER_COLOR = '#CCCCCC';
const TITLE_COLOR = '#1F4E79';
const HEADER_COLOR = '#4472C4';
const TEXT_COLOR = '#222222';
const GRAY_COLOR = '#555555';
const EXPORT_TIME_ZONE = 'Europe/Madrid';

const formatExportDateShort = (date: Date): string =>
  new Intl.DateTimeFormat('es-ES', {
    timeZone: EXPORT_TIME_ZONE,
  }).format(date);

const formatExportDateLong = (date: Date): string =>
  new Intl.DateTimeFormat('es-ES', {
    timeZone: EXPORT_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);

/** Texto PDF seguro ante objetos (evita "[object Object]"). */
const cellValueToText = (val: unknown): string => {
  if (val === null || val === undefined) {
    return '';
  }
  if (
    typeof val === 'string' ||
    typeof val === 'number' ||
    typeof val === 'boolean' ||
    typeof val === 'bigint'
  ) {
    return String(val);
  }
  try {
    return JSON.stringify(val);
  } catch {
    return '[object]';
  }
};

/**
 * Expone "buildPdfTable" en smart-economat-backend (Nest).
 * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
 * @undefined {string} title - Entrada efectiva esperada por el contrato.
 * @undefined {ExportColumn[]} columns - Entrada efectiva esperada por el contrato.
 * @undefined {Record<string, unknown>[]} rows - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export function buildPdfTable(
  res: Response,
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[]
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      autoFirstPage: false,
      size: 'A4',
      layout: 'landscape',
      margins: {
        top: PAGE_MARGIN,
        bottom: PAGE_MARGIN,
        left: PAGE_MARGIN,
        right: PAGE_MARGIN,
      },
    });

    let pageNum = 0;
    doc.on('pageAdded', () => {
      pageNum++;
      const w = doc.page.width;
      const h = doc.page.height;
      const footerY = h - PAGE_MARGIN - 10;
      const now = new Date();
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(GRAY_COLOR)
        .text(
          `SmartEconomat — ${title} | Pág. ${pageNum} | ${formatExportDateShort(now)}`,
          PAGE_MARGIN,
          footerY,
          {
            width: w - PAGE_MARGIN * 2,
            align: 'center',
            lineBreak: false,
          }
        );
    });
    doc.on('end', resolve);
    doc.on('error', reject);
    doc.pipe(res);
    doc.addPage();

    const usableWidth = doc.page.width - PAGE_MARGIN * 2;
    const totalWeight = columns.reduce((sum, c) => sum + c.width, 0);
    const colWidths = columns.map((c) => (c.width / totalWeight) * usableWidth);

    doc
      .font('Helvetica-Bold')
      .fontSize(TITLE_FONT_SIZE)
      .fillColor(TITLE_COLOR)
      .text(title, PAGE_MARGIN, PAGE_MARGIN);

    doc
      .font('Helvetica')
      .fontSize(SUMMARY_FONT_SIZE)
      .fillColor(GRAY_COLOR)
      .text(
        `Generado el ${formatExportDateLong(new Date())}`,
        PAGE_MARGIN,
        doc.y + 2
      );

    let currentY = doc.y + 12;

    const drawHeader = (startY: number): number => {
      doc
        .rect(PAGE_MARGIN, startY, usableWidth, HEADER_HEIGHT)
        .fill(HEADER_FILL);
      doc
        .fillColor(HEADER_COLOR)
        .font('Helvetica-Bold')
        .fontSize(HEADER_FONT_SIZE);
      let x = PAGE_MARGIN;
      for (let i = 0; i < columns.length; i++) {
        doc.text(columns[i].header, x + CELL_PAD_X, startY + CELL_PAD_Y + 2, {
          width: colWidths[i] - CELL_PAD_X * 2,
          lineBreak: true,
          align: 'center',
        });
        x += colWidths[i];
      }
      doc
        .rect(PAGE_MARGIN, startY, usableWidth, HEADER_HEIGHT)
        .stroke(BORDER_COLOR);

      x = PAGE_MARGIN;
      for (let i = 0; i < columns.length - 1; i++) {
        x += colWidths[i];
        doc
          .moveTo(x, startY)
          .lineTo(x, startY + HEADER_HEIGHT)
          .stroke(BORDER_COLOR);
      }
      return startY + HEADER_HEIGHT;
    };

    const getCellAlignment = (key: string): 'left' | 'center' | 'right' => {
      const centerKeys = [
        'id',
        'tipo',
        'unidad',
        'contenido',
        'codigoBarras',
        'createdAt',
      ];
      const rightKeys = ['pmp', 'precioUnitario', 'cantidad'];
      if (centerKeys.includes(key)) return 'center';
      if (rightKeys.includes(key)) return 'right';
      return 'left';
    };

    const calculateRowHeight = (row: Record<string, unknown>): number => {
      const heights = columns.map((col, i) => {
        const val = row[col.key];

        const text = cellValueToText(val);
        return (
          doc.heightOfString(text, {
            width: colWidths[i] - CELL_PAD_X * 2,
            align: getCellAlignment(col.key),
          }) +
          CELL_PAD_Y * 2
        );
      });
      return Math.max(...heights, ROW_HEIGHT);
    };

    const drawRow = (
      row: Record<string, unknown>,
      startY: number,
      even: boolean
    ): number => {
      const rowHeight = calculateRowHeight(row);

      if (even) {
        doc
          .rect(PAGE_MARGIN, startY, usableWidth, rowHeight)
          .fill(EVEN_ROW_FILL);
      }

      doc.fillColor(TEXT_COLOR).font('Helvetica').fontSize(FONT_SIZE);
      let x = PAGE_MARGIN;
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const val = row[col.key];

        const text = cellValueToText(val);
        const align = getCellAlignment(col.key);

        const textHeight = doc.heightOfString(text, {
          width: colWidths[i] - CELL_PAD_X * 2,
          align,
        });

        const yOffset = (rowHeight - textHeight) / 2;

        doc.text(text, x + CELL_PAD_X, startY + yOffset, {
          width: colWidths[i] - CELL_PAD_X * 2,
          lineBreak: true,
          align,
        });
        x += colWidths[i];
      }

      doc
        .rect(PAGE_MARGIN, startY, usableWidth, rowHeight)
        .stroke(BORDER_COLOR);

      let lx = PAGE_MARGIN;
      for (let i = 0; i < columns.length - 1; i++) {
        lx += colWidths[i];
        doc
          .moveTo(lx, startY)
          .lineTo(lx, startY + rowHeight)
          .stroke(BORDER_COLOR);
      }

      return startY + rowHeight;
    };

    const pageBottom = doc.page.height - PAGE_MARGIN - 20;
    currentY = drawHeader(currentY);

    for (let i = 0; i < rows.length; i++) {
      const rowHeight = calculateRowHeight(rows[i]);

      if (currentY + rowHeight > pageBottom) {
        doc.addPage();
        currentY = PAGE_MARGIN;
        currentY = drawHeader(currentY);
      }

      currentY = drawRow(rows[i], currentY, i % 2 === 0);
    }

    doc.end();
  });
}
