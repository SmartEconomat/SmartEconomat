// Comprueba enlaces relativos en Markdown bajo docs/ (recursivo).
// No hace peticiones HTTP. Uso: node scripts/check-docs-internal-links.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(repoRoot, 'docs');

/** @param {string} p */
function isUnderRepo(p) {
  const rel = path.relative(repoRoot, path.normalize(p));
  return rel === '' || (!rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
}

/** @param {string} dir */
function* walkMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.name === 'node_modules' || e.name === '.git') continue;
    // Archivo histórico: enlaces no mantenidos; no bloquear CI
    if (e.isDirectory() && e.name === 'archive' && dir === docsRoot) continue;
    if (e.isDirectory()) yield* walkMarkdownFiles(full);
    else if (e.isFile() && e.name.endsWith('.md')) yield full;
  }
}

// ![alt](url) o [text](url) — admite título opcional entre comillas al final
const mdLinkRe = /!?\[[^\]]*]\(\s*([^)\s]+?)(?:\s+["'][^"']*["'])?\s*\)/g;

/** Rutas bajo docs/ que empiezan por carpetas de la raíz del repo (p. ej. auditorías con enlaces a código). */
function resolveLinkTarget(mdDir, pathPart) {
  const posix = pathPart.replaceAll('\\', '/');
  if (/^(backend|frontend|ElectronInstaller|\.github|scripts|database)\//.test(posix)) {
    return path.normalize(path.join(repoRoot, ...posix.split('/').filter(Boolean)));
  }
  return path.resolve(mdDir, pathPart);
}

/**
 * @param {string} mdPath
 * @returns {{ file: string, url: string, resolved: string }[]}
 */
function brokenLinksInFile(mdPath) {
  const text = fs.readFileSync(mdPath, 'utf8');
  const dir = path.dirname(mdPath);
  const broken = [];
  let m;
  mdLinkRe.lastIndex = 0;
  while ((m = mdLinkRe.exec(text)) !== null) {
    let raw = m[1].trim();
    if (!raw || raw === '#') continue;
    if (/^(https?|mailto|vscode|file):/i.test(raw)) continue;
    if (raw.startsWith('//')) continue;

    const hashIdx = raw.indexOf('#');
    const pathPart = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw;
    if (!pathPart) continue;

    let decoded;
    try {
      decoded = decodeURIComponent(pathPart);
    } catch {
      broken.push({ file: mdPath, url: raw, resolved: '(decode error)' });
      continue;
    }

    const resolved = resolveLinkTarget(dir, decoded);
    if (!isUnderRepo(resolved)) {
      broken.push({
        file: mdPath,
        url: raw,
        resolved: `fuera del repo: ${path.relative(repoRoot, resolved)}`,
      });
      continue;
    }

    if (fs.existsSync(resolved)) continue;

    const withReadme = path.join(resolved, 'README.md');
    if (decoded.endsWith('/') && fs.existsSync(withReadme)) continue;
    if (fs.existsSync(`${resolved}.md`)) continue;

    broken.push({
      file: mdPath,
      url: raw,
      resolved: path.relative(repoRoot, resolved),
    });
  }
  return broken;
}

function main() {
  const all = [];
  for (const md of walkMarkdownFiles(docsRoot)) {
    all.push(...brokenLinksInFile(md).map((b) => ({ ...b, file: path.relative(repoRoot, b.file) })));
  }

  if (all.length) {
    console.error(`Enlaces rotos o no resueltos: ${all.length}\n`);
    for (const b of all) {
      console.error(`- ${b.file}\n  URL: ${b.url}\n  Resuelto a: ${b.resolved}\n`);
    }
    process.exit(1);
  }
  console.log('OK: enlaces relativos en docs/ resuelven a rutas existentes.');
}

main();
