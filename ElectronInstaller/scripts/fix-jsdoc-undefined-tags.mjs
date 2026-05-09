/**
 * Repara etiquetas `@undefined` corruptas (`@param` / `@returns`) en `.ts`/`.tsx`.
 * Uso: `node scripts/fix-jsdoc-undefined-tags.mjs` desde `ElectronInstaller/`.
 *
 * @module fix-jsdoc-undefined-tags
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

/** @param {string} dir */
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === 'out') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|mjs)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

/** @param {string} fp */
function fixFile(fp) {
  let src = fs.readFileSync(fp, 'utf8');
  if (!src.includes('@undefined')) return false;
  const lines = src.split('\n');
  const out = lines.map((line) => {
    if (!line.includes('* @undefined')) return line;
    if (/- Entrada\b/.test(line)) return line.replace('* @undefined', '* @param');
    return line.replace('* @undefined', '* @returns');
  });
  const next = out.join('\n');
  if (next === src) return false;
  fs.writeFileSync(fp, next, 'utf8');
  return true;
}

let n = 0;
for (const f of walk(path.join(root, 'src'))) {
  if (fixFile(f)) n++;
}
for (const f of walk(path.join(root, 'test'))) {
  if (fixFile(f)) n++;
}
console.log(`fix-jsdoc-undefined-tags: ficheros actualizados: ${n}`);
