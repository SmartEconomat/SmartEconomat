import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import type { ExportColumn } from '../mappers/producto-export.mapper';

const PAGE_MARGIN = 40;
const ROW_HEIGHT = 16;
const HEADER_HEIGHT = 20;
const CELL_PAD_X = 2;
const CELL_PAD_Y = 4;
const FONT_SIZE = 7;
const HEADER_FONT_SIZE = 8;
const TITLE_FONT_SIZE = 14;
const HEADER_FILL = '#D3D3D3';
const EVEN_ROW_FILL = '#F5F5F5';

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
      .text(title, PAGE_MARGIN, PAGE_MARGIN);

    let currentY = doc.y + 8;

    const drawHeader = (startY: number): number => {
      doc
        .rect(PAGE_MARGIN, startY, usableWidth, HEADER_HEIGHT)
        .fill(HEADER_FILL);

      doc.fillColor('black').font('Helvetica-Bold').fontSize(HEADER_FONT_SIZE);

      let x = PAGE_MARGIN;

      for (let i = 0; i < columns.length; i++) {
        doc.text(columns[i].header, x + CELL_PAD_X, startY + CELL_PAD_Y, {
          width: colWidths[i] - CELL_PAD_X * 2,
          lineBreak: false,
          ellipsis: true,
        });

        x += colWidths[i];
      }

      doc.rect(PAGE_MARGIN, startY, usableWidth, HEADER_HEIGHT).stroke();

      x = PAGE_MARGIN;

      for (let i = 0; i < columns.length - 1; i++) {
        x += colWidths[i];
        doc
          .moveTo(x, startY)
          .lineTo(x, startY + HEADER_HEIGHT)
          .stroke();
      }

      return startY + HEADER_HEIGHT;
    };

    const drawRow = (
      row: Record<string, unknown>,
      startY: number,
      even: boolean
    ): number => {
      if (even) {
        doc
          .rect(PAGE_MARGIN, startY, usableWidth, ROW_HEIGHT)
          .fill(EVEN_ROW_FILL);
      }

      doc.fillColor('black').font('Helvetica').fontSize(FONT_SIZE);

      let x = PAGE_MARGIN;

      for (let i = 0; i < columns.length; i++) {
        const value = row[columns[i].key];

        let text = '';

        if (value !== null && value !== undefined) {
          if (typeof value === 'string') {
            text = value;
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            text = value.toString();
          } else {
            text = JSON.stringify(value);
          }
        }

        doc.text(text, x + CELL_PAD_X, startY + CELL_PAD_Y, {
          width: colWidths[i] - CELL_PAD_X * 2,
          lineBreak: false,
          ellipsis: true,
        });

        x += colWidths[i];
      }

      doc.rect(PAGE_MARGIN, startY, usableWidth, ROW_HEIGHT).stroke();

      x = PAGE_MARGIN;

      for (let i = 0; i < columns.length - 1; i++) {
        x += colWidths[i];
        doc
          .moveTo(x, startY)
          .lineTo(x, startY + ROW_HEIGHT)
          .stroke();
      }

      return startY + ROW_HEIGHT;
    };

    const pageBottom = doc.page.height - PAGE_MARGIN;

    currentY = drawHeader(currentY);

    for (let i = 0; i < rows.length; i++) {
      if (currentY + ROW_HEIGHT > pageBottom) {
        doc.addPage();
        currentY = PAGE_MARGIN;
        currentY = drawHeader(currentY);
      }

      currentY = drawRow(rows[i], currentY, i % 2 === 0);
    }

    doc.end();
  });
}
