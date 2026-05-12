"""
Convierte un PDF a PPTX: una diapositiva por página, imagen a pantalla completa.
Requisitos: pip install pymupdf python-pptx
"""
from __future__ import annotations

import argparse
import sys
from io import BytesIO
from pathlib import Path

import fitz  # PyMuPDF
from pptx import Presentation
from pptx.util import Inches


# Mismo formato que export-html-to-pptx.js (A4 apaisado, pulgadas)
SLIDE_W_IN = 11.69
SLIDE_H_IN = 8.27


def main() -> int:
    parser = argparse.ArgumentParser(description="PDF → PPTX (una slide por página).")
    parser.add_argument(
        "input_pdf",
        type=Path,
        nargs="?",
        default=None,
        help="Ruta al PDF de entrada",
    )
    parser.add_argument(
        "--path-file",
        type=Path,
        default=None,
        help="Archivo UTF-8 (primera línea = ruta absoluta al PDF). Útil en Windows si la consola altera acentos o guiones.",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        dest="output_pptx",
        help="Ruta al PPTX de salida (por defecto: mismo nombre que el PDF, extensión .pptx)",
    )
    parser.add_argument(
        "--zoom",
        type=float,
        default=2.25,
        help="Factor de escala al rasterizar (por defecto 2.25, ~216 dpi efectivos)",
    )
    args = parser.parse_args()

    if args.path_file is not None:
        line = args.path_file.read_text(encoding="utf-8").splitlines()[0].strip()
        pdf_path = Path(line).expanduser().resolve()
    elif args.input_pdf is not None:
        pdf_path = args.input_pdf.expanduser().resolve()
    else:
        parser.error("Indica input_pdf o --path-file con la ruta al PDF.")

    if not pdf_path.is_file():
        print(f"No existe el archivo: {pdf_path}", file=sys.stderr)
        return 1

    out_path = args.output_pptx
    if out_path is None:
        out_path = pdf_path.with_suffix(".pptx")
    else:
        out_path = out_path.resolve()

    doc = fitz.open(pdf_path)
    page_count = doc.page_count
    if page_count == 0:
        print("El PDF no tiene páginas.", file=sys.stderr)
        doc.close()
        return 1

    prs = Presentation()
    prs.slide_width = Inches(SLIDE_W_IN)
    prs.slide_height = Inches(SLIDE_H_IN)

    try:
        blank_layout = prs.slide_layouts[6]
    except IndexError:
        blank_layout = prs.slide_layouts[5]

    mat = fitz.Matrix(args.zoom, args.zoom)

    for i in range(doc.page_count):
        page = doc.load_page(i)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        png_bytes = pix.tobytes("png")
        bio = BytesIO(png_bytes)

        slide = prs.slides.add_slide(blank_layout)
        slide.shapes.add_picture(
            bio,
            left=Inches(0),
            top=Inches(0),
            width=prs.slide_width,
            height=prs.slide_height,
        )

    doc.close()
    prs.save(out_path)
    print(f"PPTX generado ({page_count} diapositivas): {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
