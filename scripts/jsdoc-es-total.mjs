import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const skip = new Set(['node_modules', '.git', '.cursor', 'dist', 'build', 'coverage']);

function walk(d, acc = []) {
  if (!fs.existsSync(d)) return acc;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function replaceJsdoc(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const s = src.indexOf('/**', i);
    if (s === -1) {
      out += src.slice(i);
      break;
    }
    out += src.slice(i, s);
    const e = src.indexOf('*/', s + 3);
    if (e === -1) {
      out += src.slice(s);
      break;
    }

    const lineStart = src.lastIndexOf('\n', s - 1) + 1;
    const indent = src.slice(lineStart, s).match(/^\s*/)?.[0] ?? '';
    out += `${indent}/**\n${indent} * Documentación en español.\n${indent} */`;
    i = e + 2;
  }
  return out;
}

let changed = 0;
for (const f of walk(root)) {
  const src = fs.readFileSync(f, 'utf8');
  if (!src.includes('/**')) continue;
  const next = replaceJsdoc(src);
  if (next !== src) {
    fs.writeFileSync(f, next, 'utf8');
    changed++;
  }
}

console.log('jsdoc-es-total: archivos actualizados:', changed);
