import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const schemaPath = path.join(projectRoot, "resources", "templates", "env.schema.json");
const templatePath = path.join(projectRoot, "resources", "templates", "env.template.prod");

function extractTemplateKeys(template) {
  const matches = [...template.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)];
  return new Set(matches.map((match) => match[1]));
}

async function main() {
  const [schemaRaw, templateRaw] = await Promise.all([
    fs.readFile(schemaPath, "utf8"),
    fs.readFile(templatePath, "utf8"),
  ]);

  const schema = JSON.parse(schemaRaw);
  const requiredKeys = Array.isArray(schema.required) ? schema.required : [];
  const templateKeys = extractTemplateKeys(templateRaw);

  const missingInTemplate = requiredKeys.filter((key) => !templateKeys.has(key));
  const unknownTemplateKeys = [...templateKeys].filter(
    (key) => !(schema.properties && key in schema.properties),
  );

  if (missingInTemplate.length > 0 || unknownTemplateKeys.length > 0) {
    if (missingInTemplate.length > 0) {
      console.error("Faltan claves requeridas en env.template.prod:");
      for (const key of missingInTemplate) {
        console.error(` - ${key}`);
      }
    }

    if (unknownTemplateKeys.length > 0) {
      console.error("Hay placeholders no definidos en env.schema.json:");
      for (const key of unknownTemplateKeys) {
        console.error(` - ${key}`);
      }
    }

    process.exit(1);
  }

  console.log(
    `Validación OK: ${requiredKeys.length} claves requeridas alineadas entre schema y template.`,
  );
}

await main();
