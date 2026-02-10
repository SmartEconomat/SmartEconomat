const fs = require('fs');
const path = require('path');

/**
 * Script para eliminar comentarios de línea (
 * preservando aquellos que estén dentro de cadenas de texto.
 */

const EXCLUDE_DIRS = ['node_modules', 'dist', '.git', '.husky'];

const TARGET_EXT = '.ts';

/**
 * Función recursiva para encontrar archivos
 */
function findFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    console.warn(`Directorio no encontrado: ${dir}`);
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        findFiles(filePath, fileList);
      }
    } else {
      if (path.extname(file) === TARGET_EXT) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Función para eliminar comentarios de línea
 * Mantiene intactas las cadenas de texto (comillas dobles, simples, backticks).
 */
function removeLineComments(content) {
  const regex =
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\/\/[^\n\r]*)/g;

  return content.replace(regex, (match, stringLiteral, comment) => {
    if (stringLiteral) {
      return stringLiteral; // Es una cadena, la dejamos igual
    }
    return ''; // Es un comentario, lo borramos (reemplazamos por vacío)
  });
}

/**
 * Función principal
 */
function main() {
  const args = process.argv.slice(2);
  let filesToProcess = [];

  // Si se pasan argumentos, asumimos que son rutas de archivo (para lint-staged)
  if (args.length > 0) {
    filesToProcess = args;
    console.log(`Recibidos ${args.length} archivos para procesar.`);
  } else {
    // Modo manual: escanear directorio src
    // Ajuste para buscar explícitamente en ../../src relativo a este script (scripts/git-hooks)
    const srcDir = path.resolve(__dirname, '../../src');

    console.log(`Script ubicado en: ${__dirname}`);
    console.log(`Buscando archivos .ts en: ${srcDir}`);

    if (!fs.existsSync(srcDir)) {
      console.error(`Error: No se encuentra el directorio ${srcDir}`);
      process.exit(1);
    }

    filesToProcess = findFiles(srcDir);
    console.log(`Encontrados ${filesToProcess.length} archivos .ts en src.`);
  }

  let modifiedCount = 0;

  filesToProcess.forEach((file) => {
    try {
      // Asegurar ruta absoluta si viene relativa
      const absolutePath = path.isAbsolute(file)
        ? file
        : path.resolve(process.cwd(), file);

      if (!fs.existsSync(absolutePath)) {
        console.warn(`Archivo no encontrado (saltando): ${file}`);
        return;
      }

      const content = fs.readFileSync(absolutePath, 'utf8');
      const newContent = removeLineComments(content);

      if (content !== newContent) {
        fs.writeFileSync(absolutePath, newContent, 'utf8');
        console.log(`Limpio: ${path.basename(file)}`);
        modifiedCount++;
      }
    } catch (err) {
      console.error(`Error procesando ${file}:`, err.message);
    }
  });

  if (modifiedCount > 0) {
    console.log(
      `\nOperación completada. ${modifiedCount} archivos modificados.`
    );
  } else {
    console.log(`\nNingún archivo requirió cambios.`);
  }
}

main();
