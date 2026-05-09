#!/usr/bin/env node
/**
 * Codemod: asegura bloques JSDoc en español para símbolos exportados (`src/`)
 * omitiendo ficheros de prueba.
 *
 * Uso: `node scripts/apply-jsdoc-exports.mjs` (desde `ElectronInstaller/`).
 *
 * @module apply-jsdoc-exports
 */
import path from "path";
import { fileURLToPath } from "url";
import { Project, Node, SyntaxKind } from "ts-morph";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const electronRoot = path.join(__dirname, "..");

const project = new Project({
  tsConfigFilePath: path.join(electronRoot, "tsconfig.json"),
});

/**
 * Resumen legible en español a partir del identificador (heurística).
 *
 * @param {string} name - Nombre del símbolo
 * @returns {string} Frase descriptiva breve
 */
function describeFromName(name) {
  if (name === "constructor") {
    return "Construye la instancia del servicio.";
  }
  const rules = [
    [
      /^register/i,
      "Registra manejadores y canaliza IPC o integración con el proceso principal.",
    ],
    [
      /^parse/i,
      "Interpreta y normaliza datos de texto o estructuras intermedias.",
    ],
    [/^ensure/i, "Garantiza la existencia o validez del recurso indicado."],
    [/^get/i, "Obtiene el estado o valor solicitado."],
    [/^set/i, "Establece la referencia o configuración interna."],
    [/^start/i, "Inicia el flujo o proceso solicitado."],
    [/^stop/i, "Detiene el flujo o proceso en curso."],
    [/^wait/i, "Espera hasta que se cumplan las condiciones indicadas."],
    [/^probe/i, "Comprueba disponibilidad o conectividad del componente."],
    [/^generate/i, "Genera artefactos o informes solicitados."],
    [/^render/i, "Renderiza valores hacia archivo o representación estable."],
    [/^repair/i, "Repara inconsistencias conocidas del entorno."],
    [/^tail/i, "Sigue la salida de logs en tiempo (near) real."],
    [/^prune/i, "Ejecuta limpieza controlada de recursos Docker."],
  ];
  for (const [re, text] of rules) {
    if (re.test(name)) return text;
  }
  return `Expone la operación "${name}" del instalador SmartEconomat.`;
}

/**
 * Indica si el cuerpo contiene alguna sentencia throw.
 *
 * @param {import('ts-morph').Node | undefined} body - Nodo de cuerpo
 * @returns {boolean}
 */
function bodyLooksThrowing(body) {
  if (!body) return false;
  let found = false;
  body.forEachDescendant((n) => {
    if (n.getKind() === SyntaxKind.ThrowKeyword) found = true;
  });
  return found;
}

/**
 * Aplica JSDoc a una función-like (declaration, método o constructor).
 *
 * @param {import('ts-morph').FunctionDeclaration | import('ts-morph').MethodDeclaration | import('ts-morph').ArrowFunction | import('ts-morph').FunctionExpression | import('ts-morph').ConstructorDeclaration} fn - Firma objetivo
 * @param {string} explicitName - Nombre cuando la función es anónima o constructor
 * @param {import('ts-morph').VariableDeclaration | undefined} variableDeclHost - Declarador `export const x = () => …`
 * @returns {boolean} Si se insertó documentación nueva
 */
function ensureFunctionJsDoc(fn, explicitName, variableDeclHost = undefined) {
  const variableStmtHost = variableDeclHost?.getFirstAncestorByKind(
    SyntaxKind.VariableStatement,
  );

  /** @type {import('ts-morph').Node} */
  let attachTarget =
    Node.isArrowFunction(fn) || Node.isFunctionExpression(fn)
      ? (variableStmtHost ?? variableDeclHost ?? fn)
      : fn;

  const existingJsDocs =
    "getJsDocs" in attachTarget && typeof attachTarget.getJsDocs === "function"
      ? attachTarget.getJsDocs()
      : [];

  if (existingJsDocs.length > 0) {
    const first = existingJsDocs[0];
    const hasParams = first.getTags().some((t) => t.getTagName() === "param");
    const hasReturns = first
      .getTags()
      .some((t) => t.getTagName() === "returns");
    if (
      hasParams &&
      (Node.isConstructorDeclaration(fn) ? true : hasReturns) &&
      (first.getDescription().trim().length > 0 ||
        (first.getComment()?.trim()?.length ?? 0) > 0)
    ) {
      return false;
    }
  }

  let name = explicitName;
  if (Node.isConstructorDeclaration(fn)) name = "constructor";
  else if (Node.isMethodDeclaration(fn) || Node.isFunctionDeclaration(fn))
    name = fn.getName?.() ?? explicitName;

  const description = describeFromName(name);

  /** @type {{ name: string; text: string }[]} */
  const tags = [];

  const params = fn.getParameters();
  for (const p of params) {
    const typeText = p.getType().getText(p).replace(/\s+/g, " ").trim();
    tags.push({
      name: "param",
      text: `{${typeText}} ${p.getName()} - Entrada esperada por la función.`,
    });
  }

  const isCtor = Node.isConstructorDeclaration(fn);
  if (!isCtor) {
    const retText = fn.getReturnType().getText(fn).replace(/\s+/g, " ").trim();
    tags.push({
      name: "returns",
      text: `{${retText}} Resultado efectivo tras la llamada (puede incluir Promesas).`,
    });
  }

  let body;
  if (Node.isArrowFunction(fn) || Node.isFunctionExpression(fn))
    body = fn.getBody();
  else if (
    Node.isFunctionDeclaration(fn) ||
    Node.isMethodDeclaration(fn) ||
    Node.isConstructorDeclaration(fn)
  ) {
    body = fn.getBody();
  }

  const throwsLikely = bodyLooksThrowing(body ?? undefined);

  if (throwsLikely) {
    tags.push({
      name: "throws",
      text: "{Error} Si la validación o la llamada externa rechaza la operación.",
    });
  }

  attachTarget.addJsDoc({ description, tags });
  return true;
}

/**
 * Asegura documentación en interfaces.
 *
 * @param {import('ts-morph').InterfaceDeclaration} iface - Interfaz exportada
 * @returns {void}
 */
function ensureInterfaceJsDoc(iface) {
  if (iface.getJsDocs().length > 0) return;
  const n = iface.getName();
  iface.addJsDoc({
    description:
      describeFromName(`Interface_${n}`) ===
      `Expone la operación "Interface_${n}" del instalador SmartEconomat.`
        ? `Contrato tipado público (${n}).`
        : describeFromName(n),
    tags: [],
  });
}

/**
 * Asegura documentación en tipos alias exportados.
 *
 * @param {import('ts-morph').TypeAliasDeclaration} alias - Alias exportado
 * @returns {void}
 */
function ensureTypeAliasJsDoc(alias) {
  if (alias.getJsDocs().length > 0) return;
  const n = alias.getName();
  alias.addJsDoc({
    description: `Alias de tipo público (${n}).`,
    tags: [],
  });
}

/**
 * Asegura documentación en enums exportados.
 *
 * @param {import('ts-morph').EnumDeclaration} en - Enum exportado
 * @returns {void}
 */
function ensureEnumJsDoc(en) {
  if (en.getJsDocs().length > 0) return;
  en.addJsDoc({
    description: `Enumeración de dominio (${en.getName()}).`,
    tags: [],
  });
}

/**
 * Asegura documentación en clases exportadas y sus métodos públicos.
 *
 * @param {import('ts-morph').ClassDeclaration} cls - Clase exportada
 * @returns {void}
 */
function ensureClassJsDoc(cls) {
  if (cls.getJsDocs().length === 0) {
    const n = cls.getName() ?? "Service";
    cls.addJsDoc({
      description: `Servicio del proceso principal: ${n}.`,
      tags: [],
    });
  }

  for (const method of cls.getMethods()) {
    if (method.hasModifier(SyntaxKind.PrivateKeyword)) continue;
    if (method.getName().startsWith("#")) continue;
    if (method.getJsDocs().length > 0) {
      const j = method.getJsDocs()[0];
      if (
        j.getTags().some((t) => t.getTagName() === "param") &&
        j.getTags().some((t) => t.getTagName() === "returns")
      )
        continue;
    }
    ensureFunctionJsDoc(method, method.getName());
  }

  for (const ctor of cls.getConstructors()) {
    if (ctor.hasModifier(SyntaxKind.PrivateKeyword)) continue;
    if (ctor.getJsDocs().length > 0) continue;
    ensureFunctionJsDoc(ctor, "constructor");
  }
}

/**
 * Determina si un `Statement` es exportación directa (`export class`, `export const`).
 *
 * @param {import('ts-morph').Statement} stmt - Sentencia TS
 * @returns {boolean}
 */
function statementIsExported(stmt) {
  return "hasModifier" in stmt && typeof stmt.hasModifier === "function"
    ? stmt.hasModifier(SyntaxKind.ExportKeyword)
    : false;
}

/**
 * Procesa un fichero fuente aplicable (omite rutas `__tests__` y `*.test|spec.*`).
 *
 * @param {import('ts-morph').SourceFile} sf - Archivo TypeScript/React
 * @returns {number} Contador incremental de elementos documentados en la pasada actual
 */
function processSourceFile(sf) {
  const p = sf.getFilePath();
  if (p.includes(`${path.sep}__tests__${path.sep}`)) return 0;
  if (/\.(test|spec)\.(tsx?)$/.test(p)) return 0;

  let changed = 0;

  for (const stmt of sf.getStatements()) {
    if (!statementIsExported(stmt)) continue;

    if (Node.isFunctionDeclaration(stmt)) {
      if (ensureFunctionJsDoc(stmt, stmt.getName() ?? "anonymous")) changed++;
      continue;
    }

    if (Node.isClassDeclaration(stmt)) {
      ensureClassJsDoc(stmt);
      changed++;
      continue;
    }

    if (Node.isInterfaceDeclaration(stmt)) {
      ensureInterfaceJsDoc(stmt);
      changed++;
      continue;
    }

    if (Node.isTypeAliasDeclaration(stmt)) {
      ensureTypeAliasJsDoc(stmt);
      changed++;
      continue;
    }

    if (Node.isEnumDeclaration(stmt)) {
      ensureEnumJsDoc(stmt);
      changed++;
      continue;
    }

    if (Node.isVariableStatement(stmt)) {
      const declList = stmt.getDeclarationList().getDeclarations();
      const fnDecls = declList.filter((d) => {
        const i = d.getInitializer();
        return Node.isArrowFunction(i) || Node.isFunctionExpression(i);
      });
      if (fnDecls.length > 0) {
        for (const decl of fnDecls) {
          const init = decl.getInitializer();
          if (
            init &&
            (Node.isArrowFunction(init) || Node.isFunctionExpression(init))
          ) {
            if (ensureFunctionJsDoc(init, decl.getName(), decl)) changed++;
          }
        }
      } else if (stmt.getJsDocs().length === 0) {
        const names = declList.map((d) => d.getName()).join(", ");
        stmt.addJsDoc({
          description: `Constantes exportadas (${names}) compartidas por el instalador.`,
          tags: [],
        });
        changed++;
      }
    }
  }

  return changed;
}

let total = 0;
for (const sf of project.getSourceFiles()) {
  total += processSourceFile(sf);
}

await project.save();
console.log(`apply-jsdoc-exports: nodos tocados (aprox.): ${total}`);
