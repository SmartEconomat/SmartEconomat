#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const INPUT_FILES = [
  'src/seeders/datos-base-economato/lista.productos-normalizados.json',
  'src/seeders/datos-base-economato/inventario-articulos.productos-normalizados.json',
];
const OUTPUT_FILE =
  'src/seeders/datos-base-economato/catalogo.productos-normalizados.json';

function readJson(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`No existe el archivo: ${absolutePath}`);
  }

  return {
    relativePath,
    absolutePath,
    data: JSON.parse(fs.readFileSync(absolutePath, 'utf8')),
  };
}

function incrementMapCounter(target, key) {
  target[key] = (target[key] || 0) + 1;
}

function buildSummary(productos) {
  const categorias = {};
  const alergenos = {};

  for (const producto of productos) {
    incrementMapCounter(categorias, producto.tipo);
    for (const alergeno of producto.alergenos || []) {
      incrementMapCounter(alergenos, alergeno);
    }
  }

  return {
    totalProductos: productos.length,
    categorias,
    alergenos,
  };
}

function main() {
  const inputs = INPUT_FILES.map(readJson);
  const productos = [];

  for (const input of inputs) {
    const sourceFile = input.data.sourceFile || input.relativePath;
    const sourceLabel = path.basename(sourceFile, path.extname(sourceFile));

    for (const producto of input.data.productos || []) {
      productos.push({
        ...producto,
        metadataCsv: {
          ...(producto.metadataCsv || {}),
          sourceFile,
          sourceDataset: sourceLabel,
        },
      });
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceFiles: inputs.map(
      (input) => input.data.sourceFile || input.relativePath
    ),
    outputFile: OUTPUT_FILE,
    entityShape: 'CreateProductoDto-compatible plus metadataCsv',
    totalSourceProducts: productos.length,
    summary: buildSummary(productos),
    productos,
  };

  const outputAbsolutePath = path.join(ROOT, OUTPUT_FILE);
  fs.writeFileSync(
    outputAbsolutePath,
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  console.log(`Catálogo unificado generado en ${outputAbsolutePath}`);
  console.log(`Productos unificados: ${productos.length}`);
}

main();
