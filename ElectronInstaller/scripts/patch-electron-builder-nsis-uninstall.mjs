/**
 * Parche idempotente: antes de cada intento de old-uninstaller.exe, ejecutar
 * customCheckAppRunning (cierre cooperativo + taskkill) y no bloquear con
 * MessageBox tras varios reintentos.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetPath = path.resolve(
  __dirname,
  "../../node_modules/app-builder-lib/templates/nsis/include/installUtil.nsh",
);

const marker = "SMARTECONOMAT_PATCH_OLD_UNINSTALL";
const patchedBlock = `  UninstallLoop:
    IntOp $R5 $R5 + 1

    DetailPrint "Cerrando SmartEconomat antes del desinstalador previo (intento $R5)..."
    !ifmacrodef customCheckAppRunning
      !insertmacro customCheckAppRunning
    !endif

    \${if} $R5 > 8
      DetailPrint "Desinstalador anterior no finalizó; se continúa con la nueva instalación."
      ClearErrors
      Return
    \${endIf}

  OneMoreAttempt:
    ExecWait '"$uninstallerFileNameTemp" /S /KEEP_APP_DATA $0 _?=$installationDir' $R0`;

const originalBlock = `  UninstallLoop:
    IntOp $R5 $R5 + 1

    \${if} $R5 > 5
      MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "$(appCannotBeClosed)" /SD IDCANCEL IDRETRY OneMoreAttempt
      Return
    \${endIf}

  OneMoreAttempt:
    ExecWait '"$uninstallerFileNameTemp" /S /KEEP_APP_DATA $0 _?=$installationDir' $R0`;

function main() {
  if (!fs.existsSync(targetPath)) {
    console.warn(`[patch-nsis] No encontrado: ${targetPath}`);
    return;
  }

  const content = fs.readFileSync(targetPath, "utf8");
  if (content.includes(marker)) {
    console.log("[patch-nsis] installUtil.nsh ya parcheado.");
    return;
  }

  if (!content.includes(originalBlock)) {
    if (content.includes("Cerrando SmartEconomat antes del desinstalador previo")) {
      console.log("[patch-nsis] installUtil.nsh ya contiene el parche manual.");
      return;
    }
    throw new Error(
      "[patch-nsis] installUtil.nsh no coincide con el bloque esperado; revisar electron-builder.",
    );
  }

  const next = content.replace(
    originalBlock,
    `; ${marker}\n${patchedBlock}`,
  );
  fs.writeFileSync(targetPath, next, "utf8");
  console.log("[patch-nsis] Parche aplicado en installUtil.nsh.");
}

main();
