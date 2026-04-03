# Inventario de Archivos Copilot Agent - SmartEconomat

## Resumen Ejecutivo
**Exploración completada**: Búsqueda exhaustiva (media) de archivos relacionados con GitHub Copilot Agent e instrucciones.  
**Fecha**: 1 de abril de 2026  
**Estado general**: Estructura dispersa con DUPLICADOS significativos entre `.github/` y `.agent/`. Algunos archivos obligatorios FALTAN.

---

## 1. LISTA COMPLETA DE ARCHIVOS ENCONTRADOS

### Ubicación: Raíz
✅ `/home/psych/projects/SmartEconomat/AGENTS.md` (380 líneas)  
✅ `/home/psych/projects/SmartEconomat/.agent/instructions.md` (DUPLICATE virtual de AGENTS.md)

### Ubicación: `.github/`
✅ `/home/psych/projects/SmartEconomat/.github/ARCHITECTURE.md` (documentación técnica, stack + diagramas)  
✅ `/home/psych/projects/SmartEconomat/.github/copilot-instructions.md` (instrucciones de agente + dominio)  
✅ `/home/psych/projects/SmartEconomat/.github/prompts/documentation.prompt.md` (YAML + prompt)  
✅ `/home/psych/projects/SmartEconomat/.github/prompts/professional-audit.prompt.md` (YAML + prompt)  
✅ `/home/psych/projects/SmartEconomat/.github/skills/documentation-writer/SKILL.md` (instrucciones skill)  
✅ `/home/psych/projects/SmartEconomat/.github/skills/professional-audit/SKILL.md` (instrucciones skill)  
✅ `/home/psych/projects/SmartEconomat/.github/workflows/deploy.yml` (CI/CD, no relacionado con agent)

### Ubicación: `.agent/`
❌ `/home/psych/projects/SmartEconomat/.agent/instructions.md` (DUPLICATE: igual a AGENTS.md raíz)  
❌ `/home/psych/projects/SmartEconomat/.agent/prompts/documentation.prompt.md` (NEAR-DUPLICATE: idéntico a .github/prompts/)  
❌ `/home/psych/projects/SmartEeconomat/.agent/prompts/professional-audit.prompt.md` (NEAR-DUPLICATE: idéntico a .github/prompts/)  
❓ `/home/psych/projects/SmartEconomat/.agent/workflows/documentation-writer.md` (YAML style, diferente de .github/skills/)  
❓ `/home/psych/projects/SmartEconomat/.agent/workflows/professional-audit.md` (YAML style, diferente de .github/skills/)

---

## 2. VALIDACIÓN DE UBICACIONES CORRECTAS

### Estructura esperada/recomendada (VS Code + Copilot):
- **Base de instrucciones agente**: `.github/copilot-instructions.md` ✅ CORRECTO  
- **Arquitectura técnica**: `.github/ARCHITECTURE.md` ✅ CORRECTO  
- **Skills (especialización)**: `.github/skills/<nombre>/SKILL.md` ✅ CORRECTO  
- **Prompts personalizados**: `.github/prompts/*.prompt.md` ✅ CORRECTO  
- **Archivos de raíz**: `AGENTS.md` (principal) ✅ CORRECTO

### Problemas de ubicación detectados:
1. **DUPLICADO CRITICO**: `.agent/instructions.md` es copia verbatim de `AGENTS.md`
   - VS Code puede confundirse sobre cuál usar
   - `.agent/` no es carpeta estándar de Copilot

2. **NEAR-DUPLICADOS**: `.agent/prompts/*` duplican exactamente `.github/prompts/*`
   - Los contenidos son idénticos
   - `.agent/` no es reconocida por VS Code Copilot por defecto

3. **WORKFLOWS vs SKILLS inconsistencia**:
   - `.agent/workflows/documentation-writer.md`: YAML frontmatter + prompt breve
   - `.github/skills/documentation-writer/SKILL.md`: Markdown full con instrucciones detalladas
   - **Son versiones diferentes del mismo contenido (parcialmente)**

---

## 3. ARCHIVOS OBLIGATORIOS FALTANTES

Solicitados en task pero NO ENCONTRADOS:
- ❌ `PROJECT_RULES.md` — reglas de proyecto (no existe)
- ❌ `TESTING_RULES.md` — reglas de testing/calidad (no existe)
- ❌ `AGENT_PLAN.md` — plan estratégico del agente (no existe)
- ❌ `TASKS.md` — tareas/checklist del agente (no existe)
- ❌ Archivos `*.instructions.md` bajo `.github/` — no existen (solo bajo `.agent/`)

**Nota**: El proyecto sí tiene instrucciones equivalentes dispersas:
- Dominio y reglas → en `AGENTS.md`
- Arquitectura → en `.github/ARCHITECTURE.md`
- Criterios de calidad → en `AGENTS.md` (sección "Criterios de calidad obligatorios")

---

## 4. RIESGOS Y AMBIGÜEDADES DETECTADAS

### 🔴 CRÍTICO:
1. **Fragmentación**: Las instrucciones están en `AGENTS.md`, pero `.agent/instructions.md` crea duplicado → VS Code puede leer uno y pasar por alto el otro
2. **Desorganización de skills**: Workflows en `.agent/` vs Skills en `.github/` crean confusión sobre la fuente de verdad
3. **Versión mínima en workflows vs completa en skills**: 
   - `.agent/workflows/documentation-writer.md` = 30 líneas (YAML + brief)
   - `.github/skills/documentation-writer/SKILL.md` = 50+ líneas (detalladas)
   - ¿Cuál usa el agente? Ambigüedad total.

### ⚠️ ALTO:
4. **Prompts duplicados sin versionamiento**:
   - `.github/prompts/documentation.prompt.md` vs `.agent/prompts/documentation.prompt.md`
   - Sin control de versión o reconciliación clara
5. **`.agent/` no es carpeta estándar**:
   - VS Code Copilot busca en `.github/` por defecto
   - `.agent/` podría ser ignorada o no invocarse correctamente

### 🟡 MEDIO:
6. **Contenido parcialmente redundante entre ARCHITECTURE.md y AGENTS.md**:
   - ARCHITECTURE.md: stack técnico, diagramas, módulos
   - AGENTS.md: dominio, entidades, taxonomías
   - Hay solapamiento en secciones de "Convenciones"
7. **Professional-audit.prompt.md referencia `.github/copilot-instructions.md`**  
   - Línea 8: `Actúa como **Agente Autónomo de Desarrollo** (siguiendo todas las reglas de .github/copilot-instructions.md)`
   - ¿Incluye también AGENTS.md? Confusión sobre qué archivo es autoritativo.

---

## 5. CONVENCIONES VISIBLES PARA DOCUMENTACIÓN

### Convenciones de nombres detectadas:
- **Archivos agente**: `AGENTS.md` (raíz), `copilot-instructions.md` (bajo .github/)
- **Skills**: Carpeta named `<nombre-skill>/SKILL.md` (ej. `documentation-writer/SKILL.md`)
- **Prompts**: `<nombre>.prompt.md` con YAML frontmatter
- **Workflows**: En `.agent/workflows/` con YAML frontmatter + contexto breve
- **Arquitectura**: `ARCHITECTURE.md` en `.github/`

### Estilo de contenido:
- **Tono**: Español, cercano ("con buen rollo 😊"), imperativo
- **Estructura**: Secciones con h2-h3, listas, tablas, ejemplos de código
- **Enfoque**: Copilot = "Agente Autónomo" con identidad, criterios de calidad explícitos, emojis para estados
- **Contenido técnico**: Referencias a módulos, entidades TypeORM, campos CPT (Custom Post Types)
- **Markdown features**: Uso de tablas, código con lenguaje, lists, mentions de archivos con rutas
- **Idioma mixto**: Principalmente español, pero archivos YAML pueden tener títulos/descriptions en inglés

### Patrón `.instructions.md`:
- No se usa en este proyecto (vs algunos que tienen `.instructions.md` bajo carpetas específicas)
- Todo está centralizado en `.github/copilot-instructions.md`, `AGENTS.md` y skills

---

## 6. CONTENIDO CLAVE POR ARCHIVO (snapshot)

| Archivo | Líneas | Contenido clave |
|---------|--------|-----------------|
| `AGENTS.md` | 380+ | Agente Autónomo: identidad, flujo de trabajo, criterios QA, dominio CPT/taxonomías, convenciones TS |
| `.agent/instructions.md` | 380+ | DUPLICATE de AGENTS.md |
| `.github/copilot-instructions.md` | 380+ | DUPLICATE de AGENTS.md |
| `.github/ARCHITECTURE.md` | 400+ | Stack: NestJS/React/PostgreSQL, backend modules (26), frontend structure, Context API, rate limiting, migrations |
| `.github/skills/documentation-writer/SKILL.md` | 50+ | Diátaxis framework, 4 tipos doc, workflow, conciencia contextual |
| `.github/skills/professional-audit/SKILL.md` | 30+ | OWASP/SonarQube/CIS, flujo de trabajo, output en wiki/audit/ |
| `.github/prompts/documentation.prompt.md` | 80+ | Model gpt-4o, tools=true, agent=workspace, estructura Diátaxis |
| `.github/prompts/professional-audit.prompt.md` | 35+ | Model gpt-5.2-codex, referencia a copilot-instructions.md, output wiki/audit/ |
| `.agent/workflows/*.md` | 15-20 | YAML frontmatter + breve descripción (~200 chars) |

---

## 7. RECOMENDACIONES PREVIAS

**Antes de ejecutar reestructuración**:
1. Decidir fuente de verdad: 
   - AGENTS.md en raíz  
   - .github/copilot-instructions.md  
   - O consolidar en una ubicación única
2. Eliminar duplicados en `.agent/` o reconceptualizar esa carpeta
3. Alinear workflows (`.agent/workflows/`) con skills (`.github/skills/`) — ¿fusionar o separar?
4. Contemplan crear files MISSING si son realmente distintos:
   - PROJECT_RULES.md (orquestación de módulos, patrones arquitectónicos)
   - TESTING_RULES.md (strategies, coverage, frameworks)
   - AGENT_PLAN.md (objetivos de corto/largo plazo del agente)
   - TASKS.md (checklist de tareas recurrentes o goals)
5. Generar SINGLE SOURCE OF TRUTH para cada dominio

---

## Referencias encontradas
- `wiki/development/testing/ARCHITECTURE.md` — testing architecture (no es Copilot agent)
- `wiki/audits/` — actual audit reports (generated output, not agent input)
- Repo-memory files en `/memories/repo/` — notas técnicas de dominio (no son Copilot agent)
