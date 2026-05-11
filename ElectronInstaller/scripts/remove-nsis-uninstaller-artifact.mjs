/**
 * Elimina el .exe auxiliar `*.__uninstaller.exe` que deja NSIS en `dist/`.
 * Sustituye `find ... -delete` para que `npm run build:win*` funcione en Windows
 * (donde `find` no es el de GNU).
 */
import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
try {
  const names = await readdir(distDir);
  for (const name of names) {
    if (name.endsWith(".__uninstaller.exe")) {
      await unlink(join(distDir, name));
    }
  }
} catch (err) {
  if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
    process.exit(0);
  }
  throw err;
}
