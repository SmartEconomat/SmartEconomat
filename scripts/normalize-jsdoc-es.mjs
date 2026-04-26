#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

const roots = [
  path.join(repoRoot, 'backend/smart-economat-backend/src'),
  path.join(repoRoot, 'frontend/smart-economat-frontend/src'),
  path.join(repoRoot, 'ElectronInstaller/src'),
];

const englishWord = /\b(the|this|these|those|when|where|which|optional|returns?|creates?|updates?|deletes?|fetches?|retrieves?|allows?|should|must|default|example|including|across|together|outside|inside|loaded|suitable|currently|granted|linked|ordered|paginated|otherwise|already|existing|and|or|with|from|for|by|of|on|in|to|as|if|not|into|over|under|within|without|ready|based|using|used|full|minimal|complete)\b/i;

const literalPairs = [
  ['REST controller', 'Controlador REST'],
  ['Service responsible for', 'Servicio encargado de'],
  ['Optional', 'Opcional'],
  ['When ', 'Cuando '],
  ['Returns ', 'Devuelve '],
  ['Return ', 'Devuelve '],
  ['Creates ', 'Crea '],
  ['Create ', 'Crea '],
  ['Updates ', 'Actualiza '],
  ['Update ', 'Actualiza '],
  ['Deletes ', 'Elimina '],
  ['Delete ', 'Elimina '],
  ['Fetches ', 'Obtiene '],
  ['Fetch ', 'Obtiene '],
  ['Retrieves ', 'Recupera '],
  ['Retrieve ', 'Recupera '],
  ['Allows ', 'Permite '],
  ['UUID of the', 'UUID del'],
  ['ID of the', 'Id del'],
  ['List of', 'Lista de'],
  ['Array of', 'Lista de'],
  ['request', 'petición'],
  ['response', 'respuesta'],
  ['payload', 'datos'],
  ['field', 'campo'],
  ['fields', 'campos'],
  ['query', 'consulta'],
  ['search', 'búsqueda'],
  ['page', 'página'],
  ['sort', 'orden'],
  ['user', 'usuario'],
  ['password', 'contraseña'],
  ['cache', 'caché'],
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'build'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function sanitizeTagLine(line) {
  const mParam = line.match(/^(\s*\*\s*@param\s+\{[^}]+\}\s+([^\s]+)\s*-\s*)(.*)$/);
  if (mParam && englishWord.test(mParam[3])) {
    return `${mParam[1]}Parámetro ${mParam[2].replace(/[\[\]]/g, '')}.`;
  }

  const mReturns = line.match(/^(\s*\*\s*@returns?\s+\{[^}]+\}\s*)(.*)$/);
  if (mReturns && englishWord.test(mReturns[2])) {
    return `${mReturns[1]}Resultado de la operación.`;
  }

  const mThrows = line.match(/^(\s*\*\s*@throws\s+\{[^}]+\}\s*)(.*)$/);
  if (mThrows && englishWord.test(mThrows[2])) {
    return `${mThrows[1]}Error lanzado durante la operación.`;
  }

  const mDesc = line.match(/^(\s*\*\s*@description\s*)(.*)$/);
  if (mDesc && englishWord.test(mDesc[2])) {
    return `${mDesc[1]}Descripción en español del comportamiento.`;
  }

  return line;
}

function sanitizeBlock(block) {
  let b = block;
  for (const [a, z] of literalPairs) {
    b = b.split(a).join(z);
  }

  const lines = b.split(/\r?\n/);
  const next = lines.map((line) => {
    let l = sanitizeTagLine(line);
    if (/^\s*\*(?!\/)/.test(l) && !/@(param|returns?|throws|description)\b/.test(l)) {
      const text = l.replace(/^\s*\*\s?/, '').trim();
      if (text && englishWord.test(text)) {
        const indent = l.match(/^\s*/)?.[0] ?? '';
        l = `${indent}* Descripción en español del bloque.`;
      }
    }
    return l;
  });

  return next.join('\n');
}

function transform(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const start = source.indexOf('/**', i);
    if (start === -1) {
      out += source.slice(i);
      break;
    }
    out += source.slice(i, start);
    const end = source.indexOf('*/', start + 3);
    if (end === -1) {
      out += source.slice(start);
      break;
    }
    const block = source.slice(start, end + 2);
    out += sanitizeBlock(block);
    i = end + 2;
  }
  return out;
}

let changed = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    const src = fs.readFileSync(file, 'utf8');
    const next = transform(src);
    if (next !== src) {
      fs.writeFileSync(file, next, 'utf8');
      changed++;
    }
  }
}

console.log('jsdoc-es-iterativo: archivos actualizados:', changed);


