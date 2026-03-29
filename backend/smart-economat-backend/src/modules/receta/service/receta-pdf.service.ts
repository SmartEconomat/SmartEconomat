import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { RecetaService } from './receta.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { Jimp, JimpMime } from 'jimp';

const MARGIN = 28;
const FONT_TITLE = 20;
const FONT_SUBTITLE = 12;
const FONT_HEADER = 9;
const FONT_BODY = 8;
const ROW_H = 18;
const CONTENT_PADDING = 16;
const SECTION_GAP = 12;
const STEP_GAP = 6;

const COLORS = {
  PRIMARY: '#1a2b3c',
  SECONDARY: '#2c3e50',
  ACCENT: '#3498db',
  TEXT: '#2d3436',
  GRAY: '#636e72',
  BORDER: '#dfe6e9',
  HEADER_BG: '#f8f9fa',
  PANEL_BG: '#fbfcfe',
  PANEL_ALT_BG: '#f4f7fb',
  SUCCESS: '#27ae60',
  ERROR: '#e74c3c',
};

export interface CompleteRecetaData {
  receta: {
    nombre?: string;
    pathImgOptimized?: string;
    pathImg?: string;
    dificultad?: string;
    ingredientes?: Array<{
      producto?: {
        nombre?: string;
        id?: string;
        alergenos?: Array<{ alergeno?: string }>;
      };
      cantidad: number;
      unidad?: string;
      merma?: number;
    }>;
    instrucciones?: string;
    rendimiento?: string;
    unidadResultado?: string;
    raciones?: number;
    tiempoEstimadoMinutos?: number;
  };
  alergenosConsolidados: string[];
  escandallo: {
    desglosePorIngrediente: Array<{
      productoId?: string;
      cantidadReal?: number;
    }>;
  };
  printDate: string;
}

export interface RecetaPdfOptions {
  includeImage?: boolean;
}

const ALERGENOS_FILES: Record<string, { filename: string; label: string }> = {
  GLUTEN: { filename: 'gluten.png', label: 'Gluten' },
  CRUSTACEOS: { filename: 'crustaceos.png', label: 'Crustáceos' },
  HUEVOS: { filename: 'huevos.png', label: 'Huevos' },
  PESCADO: { filename: 'pescado.png', label: 'Pescado' },
  CACAHUETES: { filename: 'cacahuetes.png', label: 'Cacahuetes' },
  SOJA: { filename: 'soja.png', label: 'Soja' },
  LACTEOS: { filename: 'lacteos.png', label: 'Lácteos' },
  FRUTOS_CON_CASCARA: {
    filename: 'frutos_cascara.png',
    label: 'Frutos Cáscara',
  },
  APIO: { filename: 'apio.png', label: 'Apio' },
  MOSTAZA: { filename: 'mostaza.png', label: 'Mostaza' },
  SESAMO: { filename: 'sesamo.png', label: 'Sésamo' },
  SULFITO: { filename: 'sulfitos.png', label: 'Sulfitos' },
  ALTRAMUCES: { filename: 'altramuces.png', label: 'Altramuces' },
  MOLUSCOS: { filename: 'moluscos.png', label: 'Moluscos' },
};

const ALERGENOS_ASSETS_DIR = path.join(process.cwd(), 'src/assets/alergenos');

@Injectable()
export class RecetaPdfService {
  private static webpDecoderInitPromise?: Promise<void>;

  constructor(
    private readonly recetaService: RecetaService,
    private readonly configService: ConfigService
  ) {}

  async generatePdf(
    ids: string[],
    res: Response,
    options: RecetaPdfOptions = {}
  ): Promise<void> {
    try {
      const recipesData: CompleteRecetaData[] = [];
      for (const id of ids) {
        recipesData.push(await this.getCompleteRecetaData(id));
      }

      if (recipesData.length === 0) return;

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        displayTitle: true,
        autoFirstPage: false,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=SmartEconomat_Fichas_${new Date().getTime()}.pdf`
      );

      doc.pipe(res);

      for (let i = 0; i < recipesData.length; i++) {
        doc.addPage();
        await this.renderRecipe(doc, recipesData[i], options);
      }

      doc.end();
    } catch (error) {
      if (!res.headersSent) {
        throw error;
      } else {
        res.end();
      }
    }
  }

  private async getCompleteRecetaData(id: string): Promise<CompleteRecetaData> {
    const detalle = await this.recetaService.getDetalle(id);
    const escandallo = await this.recetaService.calcularEscandallo(id);

    return {
      ...detalle,
      escandallo,
      printDate: new Date().toLocaleDateString('es-ES'),
    } as CompleteRecetaData;
  }

  private async renderRecipe(
    doc: PDFKit.PDFDocument,
    data: CompleteRecetaData,
    options: RecetaPdfOptions = {}
  ): Promise<void> {
    const { receta, alergenosConsolidados, escandallo } = data;

    const includeImage = options.includeImage !== false;
    const hasImage =
      includeImage && (!!receta.pathImgOptimized || !!receta.pathImg);
    const imgWidth = 118;
    const imgHeight = 118;
    const contentWidth = doc.page.width - MARGIN * 2;

    const finalImageSource = hasImage
      ? await this.resolveRecipeImageSource(
          receta.pathImgOptimized || receta.pathImg
        )
      : null;
    const finalHasImage = !!finalImageSource;

    const headerTextX = MARGIN + CONTENT_PADDING;
    const imageX = MARGIN + contentWidth - CONTENT_PADDING - imgWidth;
    const headerTextWidth = finalHasImage
      ? contentWidth - CONTENT_PADDING * 2 - imgWidth - CONTENT_PADDING
      : contentWidth - CONTENT_PADDING * 2;
    const imageBottom = finalHasImage
      ? MARGIN + CONTENT_PADDING + imgHeight - 16
      : MARGIN;

    const headerHeight = finalHasImage ? 132 : 104;

    this.drawPanel(
      doc,
      MARGIN,
      MARGIN,
      contentWidth,
      headerHeight,
      COLORS.PANEL_BG,
      COLORS.BORDER,
      12
    );

    let cursorY = MARGIN + CONTENT_PADDING;
    doc
      .fillColor(COLORS.ACCENT)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('FICHA TÉCNICA DE RECETA', headerTextX, cursorY, {
        width: headerTextWidth,
        characterSpacing: 0.9,
      });

    cursorY += 14;
    doc
      .fillColor(COLORS.PRIMARY)
      .font('Helvetica-Bold')
      .fontSize(FONT_TITLE)
      .text((receta.nombre || 'RECETA').toUpperCase(), headerTextX, cursorY, {
        width: headerTextWidth,
        lineGap: 1,
        height: 42,
        ellipsis: true,
      });

    cursorY = Math.min(doc.y + 6, MARGIN + 64);

    const subtitleParts = [
      receta.dificultad ? `Dificultad: ${receta.dificultad}` : null,
      receta.ingredientes?.length
        ? `${receta.ingredientes.length} ingredientes`
        : null,
    ].filter(Boolean);

    doc
      .fillColor(COLORS.GRAY)
      .font('Helvetica')
      .fontSize(8.5)
      .text(subtitleParts.join(' · '), headerTextX, cursorY, {
        width: headerTextWidth,
        height: 16,
        ellipsis: true,
      });

    cursorY += 18;

    const description = (receta.instrucciones || '')
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 1)
      .join(' ');

    if (description) {
      doc
        .fillColor(COLORS.TEXT)
        .font('Helvetica')
        .fontSize(8.5)
        .text(description, headerTextX, cursorY, {
          width: headerTextWidth,
          height: 30,
          ellipsis: true,
          lineGap: 1,
        });
    }

    if (finalHasImage) {
      const imagePanelY = MARGIN + CONTENT_PADDING;
      const imagePanelHeight = imgHeight - 16;
      const imageInset = 6;
      const imageRenderX = imageX + imageInset;
      const imageRenderY = imagePanelY + imageInset;
      const imageRenderWidth = imgWidth - imageInset * 2;
      const imageRenderHeight = imagePanelHeight - imageInset * 2;

      this.drawPanel(
        doc,
        imageX,
        imagePanelY,
        imgWidth,
        imagePanelHeight,
        '#ffffff',
        COLORS.BORDER,
        10
      );

      try {
        doc.save();
        doc
          .roundedRect(
            imageRenderX,
            imageRenderY,
            imageRenderWidth,
            imageRenderHeight,
            8
          )
          .clip();
        doc.image(finalImageSource, imageRenderX, imageRenderY, {
          cover: [imageRenderWidth, imageRenderHeight],
          align: 'center',
          valign: 'center',
        });
        doc.restore();
      } catch {
        /* ignore drawing errors after check */
      }
    }

    const headerBottom = Math.max(doc.y + 8, imageBottom) + SECTION_GAP;
    const statGap = 8;
    const statWidth = (contentWidth - statGap * 2) / 3;
    const statY = headerBottom;

    this.drawInfoBox(
      doc,
      'RENDIMIENTO',
      `${receta.rendimiento || '—'} ${receta.unidadResultado || ''}`.trim(),
      MARGIN,
      statY,
      statWidth
    );
    this.drawInfoBox(
      doc,
      'RACIONES',
      `${receta.raciones || '—'} porciones`,
      MARGIN + statWidth + statGap,
      statY,
      statWidth
    );
    this.drawInfoBox(
      doc,
      'TIEMPO',
      receta.tiempoEstimadoMinutos
        ? `${receta.tiempoEstimadoMinutos} min`
        : '—',
      MARGIN + (statWidth + statGap) * 2,
      statY,
      statWidth
    );

    const allergensY = statY + 38 + SECTION_GAP;
    this.drawAllergensBox(
      doc,
      alergenosConsolidados,
      MARGIN,
      allergensY,
      contentWidth
    );

    let currentY = allergensY + 74 + SECTION_GAP;
    currentY = this.drawSectionTitle(
      doc,
      'LISTADO DE INGREDIENTES',
      MARGIN,
      currentY,
      contentWidth
    );

    const tableCols = [
      { label: 'PRODUCTO', width: 0.4, align: 'left' },
      { label: 'CANT.', width: 0.12, align: 'right' },
      { label: 'UD', width: 0.1, align: 'center' },
      { label: 'MERMA', width: 0.1, align: 'right' },
      { label: 'B. REAL', width: 0.13, align: 'right' },
      { label: 'ALÉRG.', width: 0.15, align: 'right' },
    ];

    const tableWidth = contentWidth;
    currentY = this.drawTableHeader(
      doc,
      MARGIN,
      currentY,
      tableWidth,
      tableCols
    );

    doc.font('Helvetica').fontSize(FONT_BODY).fillColor(COLORS.TEXT);
    (
      receta.ingredientes as
        | Array<{
            producto?: {
              nombre?: string;
              id?: string;
              alergenos?: Array<{ alergeno?: string }>;
            };
            cantidad: number;
            unidad?: string;
            merma?: number;
          }>
        | undefined
    )?.forEach((ing, idx) => {
      const productText = ing.producto?.nombre || '—';
      const alersText =
        (ing.producto?.alergenos || [])
          .map((pa) => (pa.alergeno || '').replace(/_/g, ' '))
          .join(', ') || '—';

      const h1 = doc.heightOfString(productText, {
        width: tableWidth * 0.4 - 10,
      });
      const h2 = doc.heightOfString(alersText, {
        width: tableWidth * 0.15 - 10,
      });
      const currentLineHeight = Math.max(ROW_H, h1 + 5, h2 + 5);

      if (currentY + currentLineHeight > doc.page.height - MARGIN - 90) {
        doc.addPage();
        currentY = this.drawSectionTitle(
          doc,
          'LISTADO DE INGREDIENTES',
          MARGIN,
          MARGIN,
          contentWidth,
          'CONTINUACIÓN'
        );
        currentY = this.drawTableHeader(
          doc,
          MARGIN,
          currentY,
          tableWidth,
          tableCols
        );
      }

      this.drawPanel(
        doc,
        MARGIN,
        currentY,
        tableWidth,
        currentLineHeight,
        idx % 2 === 0 ? '#ffffff' : COLORS.PANEL_BG,
        COLORS.BORDER,
        0,
        0.35
      );

      doc.fillColor(COLORS.TEXT);
      let xOffset = MARGIN;
      const escandalloIng = escandallo.desglosePorIngrediente.find(
        (ei: { productoId?: string }) => ei.productoId === ing.producto?.id
      );
      const realQty = escandalloIng?.cantidadReal || ing.cantidad;

      doc.text(productText, xOffset + 6, currentY + 4, {
        width: tableWidth * 0.4 - 10,
      });
      xOffset += tableWidth * 0.4;

      doc.text(ing.cantidad.toString(), xOffset + 5, currentY + 4, {
        width: tableWidth * 0.12 - 10,
        align: 'right',
      });
      xOffset += tableWidth * 0.12;
      doc.text(ing.unidad || '—', xOffset + 5, currentY + 4, {
        width: tableWidth * 0.1 - 10,
        align: 'center',
      });
      xOffset += tableWidth * 0.1;
      doc.text(`${ing.merma ?? 0}%`, xOffset + 5, currentY + 4, {
        width: tableWidth * 0.1 - 10,
        align: 'right',
      });
      xOffset += tableWidth * 0.1;
      doc
        .font('Helvetica-Bold')
        .text(realQty.toFixed(2), xOffset + 5, currentY + 4, {
          width: tableWidth * 0.13 - 10,
          align: 'right',
        });
      doc.font('Helvetica');
      xOffset += tableWidth * 0.13;

      doc
        .fontSize(FONT_BODY - 2)
        .fillColor(COLORS.GRAY)
        .text(alersText, xOffset + 5, currentY + 4, {
          width: tableWidth * 0.15 - 10,
          align: 'right',
        });
      doc.fontSize(FONT_BODY);

      currentY += currentLineHeight - 1;
    });

    currentY += SECTION_GAP;
    if (currentY > doc.page.height - MARGIN - 96) {
      doc.addPage();
      currentY = MARGIN;
    }

    currentY = this.drawSectionTitle(
      doc,
      'ELABORACIÓN PASO A PASO',
      MARGIN,
      currentY,
      contentWidth
    );
    currentY -= 1;

    if (receta.instrucciones) {
      const lines = receta.instrucciones
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      lines.forEach((line, index) => {
        const cleanLine = line
          .replace(/^\d+[.)]\s*/, '')
          .replace(/^[-•]\s*/, '');
        const stepTextX = MARGIN + 17;
        const stepTextY = currentY + 1;
        const stepTextWidth = contentWidth - 18;
        doc.font('Helvetica').fontSize(FONT_BODY + 0.4);
        const stepTextHeight = doc.heightOfString(cleanLine, {
          width: stepTextWidth,
          align: 'justify',
          lineGap: 0.5,
        });
        const stepHeight = Math.max(16, stepTextHeight + 8);

        if (currentY + stepHeight > doc.page.height - MARGIN - 44) {
          doc.addPage();
          currentY = this.drawSectionTitle(
            doc,
            'ELABORACIÓN PASO A PASO',
            MARGIN,
            MARGIN,
            contentWidth,
            'CONTINUACIÓN'
          );
          currentY -= 1;
        }

        const bulletX = MARGIN + 7;
        const bulletY = currentY + 7;
        doc.circle(bulletX, bulletY, 5.5).fill(COLORS.ACCENT);
        doc
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .fontSize(6.2)
          .text(`${index + 1}`, bulletX - 2.5, bulletY - 3, {
            width: 5,
            align: 'center',
          });
        doc
          .font('Helvetica')
          .fillColor(COLORS.TEXT)
          .fontSize(FONT_BODY + 0.4)
          .text(cleanLine, stepTextX, stepTextY, {
            width: stepTextWidth,
            align: 'justify',
            lineGap: 0.5,
          });

        currentY += stepHeight + STEP_GAP;
      });
    } else {
      doc
        .font('Helvetica')
        .fontSize(FONT_BODY + 0.4)
        .fillColor(COLORS.GRAY)
        .text(
          'No hay instrucciones detalladas para esta receta.',
          MARGIN,
          currentY + 2,
          {
            width: contentWidth,
          }
        );
      currentY += 18;
    }

    const footerHeight = 18;

    if (currentY > doc.page.height - MARGIN - footerHeight - 8) {
      doc.addPage();
      currentY = MARGIN;
    }

    const footY = currentY + 4;
    doc
      .strokeColor(COLORS.BORDER)
      .lineWidth(0.6)
      .moveTo(MARGIN, footY)
      .lineTo(doc.page.width - MARGIN, footY)
      .stroke();
    doc
      .fontSize(7)
      .fillColor(COLORS.GRAY)
      .font('Helvetica')
      .text(
        `SmartEconomat Kitchen Suite · Impreso ${data.printDate}`,
        MARGIN,
        footY + 5,
        {
          width: doc.page.width - MARGIN * 2,
          align: 'right',
        }
      );
  }
  private async resolveRecipeImageSource(
    imageUrl?: string | null
  ): Promise<string | Buffer | null> {
    const imagePath = this.resolveRecipeImagePath(imageUrl);

    if (!imagePath) {
      return null;
    }

    if (path.extname(imagePath).toLowerCase() !== '.webp') {
      return imagePath;
    }

    try {
      await this.initializeWebpDecoder();
      const { default: decodeWebp } = await this.loadEsmModule<{
        default: (buffer: Buffer) => Promise<{
          data: Uint8Array | Uint8ClampedArray;
          width: number;
          height: number;
        }>;
      }>('@jsquash/webp/decode.js');
      const imageBuffer = await fs.promises.readFile(imagePath);
      const decodedImage = await decodeWebp(imageBuffer);
      const image = await Jimp.read(Buffer.from(decodedImage.data));

      const buffer = (await (image as any).getBufferAsync(
        JimpMime.png
      )) as Buffer;
      return buffer;
    } catch {
      return null;
    }
  }

  private async initializeWebpDecoder(): Promise<void> {
    if (!RecetaPdfService.webpDecoderInitPromise) {
      RecetaPdfService.webpDecoderInitPromise = (async () => {
        const { init: initDecoder } = await this.loadEsmModule<{
          init: (options: { wasmBinary: Buffer }) => Promise<void>;
        }>('@jsquash/webp/decode.js');
        const decoderWasmPath = path.resolve(
          process.cwd(),
          'node_modules/@jsquash/webp/codec/dec/webp_dec.wasm'
        );
        const decoderWasm = await fs.promises.readFile(decoderWasmPath);

        await initDecoder({ wasmBinary: decoderWasm });
      })();
    }

    await RecetaPdfService.webpDecoderInitPromise;
  }

  private resolveRecipeImagePath(imageUrl?: string | null): string | null {
    if (!imageUrl?.trim()) {
      return null;
    }

    const normalizedUrl = this.normalizeImageUrl(imageUrl);
    const configUploadDir =
      this.configService.get<string>('LOCAL_STORAGE_PATH') || './uploads';
    const uploadDirCandidates = [
      path.resolve(process.cwd(), configUploadDir),
      path.resolve(configUploadDir),
      path.resolve(process.cwd(), 'uploads'),
    ];

    const possiblePaths = new Set<string>();
    const filename = this.extractFilenameFromImageUrl(normalizedUrl);

    if (path.isAbsolute(normalizedUrl)) {
      possiblePaths.add(normalizedUrl);
    }

    possiblePaths.add(
      path.resolve(process.cwd(), normalizedUrl.replace(/^\/+/, ''))
    );
    possiblePaths.add(path.resolve(normalizedUrl));

    for (const uploadDir of uploadDirCandidates) {
      if (filename) {
        possiblePaths.add(path.resolve(uploadDir, filename));
      }
    }

    for (const candidatePath of possiblePaths) {
      if (fs.existsSync(candidatePath)) {
        return candidatePath;
      }
    }

    return null;
  }

  private normalizeImageUrl(imageUrl: string): string {
    const trimmedUrl = imageUrl.trim();

    try {
      return decodeURIComponent(new URL(trimmedUrl).pathname).split('?')[0];
    } catch {
      return decodeURIComponent(trimmedUrl.split('?')[0]);
    }
  }

  private extractFilenameFromImageUrl(imageUrl: string): string | null {
    const filename = path.basename(imageUrl);
    return filename ? filename : null;
  }

  private async loadEsmModule<T>(specifier: string): Promise<T> {
    const module = await import(specifier);
    return module.default || module;
  }

  private drawPanel(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: string,
    strokeColor: string,
    radius = 10,
    lineWidth = 0.5
  ) {
    doc.save();
    doc.lineWidth(lineWidth).roundedRect(x, y, width, height, radius);
    doc.fillAndStroke(fillColor, strokeColor);
    doc.restore();
  }

  private drawSectionTitle(
    doc: PDFKit.PDFDocument,
    title: string,
    x: number,
    y: number,
    width: number,
    badge?: string
  ): number {
    doc
      .fillColor(COLORS.PRIMARY)
      .font('Helvetica-Bold')
      .fontSize(FONT_SUBTITLE)
      .text(title, x, y);

    if (badge) {
      const badgeWidth = 88;
      this.drawPanel(
        doc,
        x + width - badgeWidth,
        y - 2,
        badgeWidth,
        18,
        COLORS.PANEL_ALT_BG,
        COLORS.BORDER,
        9,
        0.4
      );
      doc
        .fillColor(COLORS.ACCENT)
        .font('Helvetica-Bold')
        .fontSize(7)
        .text(badge, x + width - badgeWidth, y + 4, {
          width: badgeWidth,
          align: 'center',
        });
    }

    const lineY = y + 17;
    doc
      .strokeColor(COLORS.BORDER)
      .lineWidth(0.7)
      .moveTo(x, lineY)
      .lineTo(x + width, lineY)
      .stroke();

    return lineY + 5;
  }

  private drawTableHeader(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    columns: Array<{ label: string; width: number; align: string }>
  ): number {
    this.drawPanel(
      doc,
      x,
      y,
      width,
      ROW_H,
      COLORS.PANEL_ALT_BG,
      COLORS.BORDER,
      0,
      0.45
    );
    doc
      .fillColor(COLORS.SECONDARY)
      .font('Helvetica-Bold')
      .fontSize(FONT_HEADER);

    let xOffset = x;
    columns.forEach((col) => {
      doc.text(col.label, xOffset + 8, y + 4, {
        width: width * col.width - 16,
        align: col.align as 'left' | 'center' | 'right' | undefined,
      });
      xOffset += width * col.width;
    });

    return y + ROW_H + 4;
  }

  private drawInfoBox(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number
  ) {
    const boxH = 38;
    this.drawPanel(doc, x, y, width, boxH, '#ffffff', COLORS.BORDER, 10);
    doc
      .fillColor(COLORS.GRAY)
      .font('Helvetica-Bold')
      .fontSize(6.8)
      .text(label.toUpperCase(), x + 10, y + 7, {
        width: width - 20,
        align: 'left',
        characterSpacing: 0.7,
      });
    doc
      .fillColor(COLORS.PRIMARY)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(value, x + 10, y + 19, {
        width: width - 20,
        align: 'left',
        ellipsis: true,
      });
  }

  private drawAllergensBox(
    doc: PDFKit.PDFDocument,
    alergenos: string[],
    x: number,
    y: number,
    width: number
  ) {
    const boxH = 78;
    this.drawPanel(doc, x, y, width, boxH, '#ffffff', COLORS.BORDER, 10);
    doc
      .fillColor(COLORS.GRAY)
      .font('Helvetica-Bold')
      .fontSize(7)
      .text('DECLARACIÓN DE ALÉRGENOS (UE)', x + 12, y + 10, {
        characterSpacing: 0.6,
      });

    const presentSet = new Set(alergenos || []);
    const allIds = Object.keys(ALERGENOS_FILES);

    const columns = 7;
    const iconSize = 18;
    const contentPaddingX = 12;
    const colSpacing = (width - contentPaddingX * 2) / columns;
    const rowSpacing = 26;
    const startX = x + 12 + colSpacing / 2;
    const startY = y + 28;

    allIds.forEach((id, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const currentX = startX + column * colSpacing;
      const currentY = startY + row * rowSpacing;
      const isPresent = presentSet.has(id);
      const info = ALERGENOS_FILES[id];

      doc.save();
      if (!isPresent) doc.opacity(0.15);

      try {
        const imgPath = path.join(ALERGENOS_ASSETS_DIR, info.filename);
        if (fs.existsSync(imgPath)) {
          doc.image(imgPath, currentX - iconSize / 2, currentY - iconSize / 2, {
            fit: [iconSize, iconSize],
          });
        } else {
          doc.circle(currentX, currentY, iconSize / 4).fill(COLORS.GRAY);
        }
      } catch {
        doc.circle(currentX, currentY, iconSize / 4).fill(COLORS.GRAY);
      }

      doc.restore();

      doc
        .fillColor(isPresent ? COLORS.PRIMARY : COLORS.GRAY)
        .font('Helvetica-Bold')
        .fontSize(4.7)
        .text(
          info.label.toUpperCase(),
          currentX - colSpacing / 2,
          currentY + iconSize / 2 + 2,
          {
            width: colSpacing,
            align: 'center',
            lineBreak: true,
          }
        );
    });
  }
}
