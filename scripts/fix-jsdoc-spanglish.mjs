import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

const PAIRS = [
  ['Devuelve una lista paginada list of', 'Devuelve una lista paginada de'],
  [
    'Devuelve una proyección mínima user list suitable for dropdowns and autocomplete widgets.',
    'Devuelve una proyección mínima de usuarios para desplegables y autocompletado.',
  ],
  ['Recupera un usuario by UUID.', 'Recupera un usuario por UUID.'],
  ['Crea una instancia of ', 'Crea una instancia de '],
  ['Crea un usuario estándar account.', 'Crea una cuenta de usuario estándar.'],
];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

const roots = [
  path.join(repoRoot, 'backend/smart-economat-backend/src'),
  path.join(repoRoot, 'frontend/smart-economat-frontend/src'),
];

let files = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const f of walk(root)) {
    let s = fs.readFileSync(f, 'utf8');
    const orig = s;
    for (const [a, b] of PAIRS) {
      if (s.includes(a)) s = s.split(a).join(b);
    }
    if (s !== orig) {
      fs.writeFileSync(f, s, 'utf8');
      files++;
    }
  }
}
console.log('fix-jsdoc-spanglish: archivos:', files);
