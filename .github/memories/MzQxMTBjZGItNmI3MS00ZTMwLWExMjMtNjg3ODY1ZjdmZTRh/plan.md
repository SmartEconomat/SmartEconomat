## Plan: Reestructurar Copilot Agent

Configurar el repositorio según la especificación actual de GitHub Copilot usando `.github/copilot-instructions.md` como única instrucción global activa, creando `.github/instructions/` con instrucciones por área, moviendo/creando los Markdown raíz obligatorios y preservando contenido existente mediante reutilización y añadidos mínimos. La ejecución debe ser no destructiva respecto al trabajo ajeno: no tocar código fuente, no revertir el árbol sucio actual y mover solo los documentos objetivo.

**Steps**
1. Fase 1 — Preparación y preservación
   Revisar el estado actual del árbol y aislar la intervención a archivos de instrucciones/documentación; no tocar los cambios ajenos ya presentes en `wiki/**` ni otras rutas no objetivo. Tener en cuenta que `.github/ARCHITECTURE.md` existe y además está sin confirmar, así que debe preservarse íntegramente al moverlo a raíz.
2. Fase 1 — Desactivar la doble instrucción global
   Sacar `AGENTS.md` del circuito activo de Copilot, porque la referencia actual recomienda usar `copilot-instructions.md` o `AGENTS.md`, pero no ambos. La forma más segura es renombrarlo a un documento no operativo de archivo/legado para no perder contenido ni incumplir la restricción de no eliminar archivos. *bloquea el paso 3*
3. Fase 2 — Consolidar la instrucción global oficial
   Mantener `.github/copilot-instructions.md` como fuente global única y añadir en la parte superior una sección breve de “fuentes canónicas” y reglas críticas que incluya explícitamente: leer `ARCHITECTURE.md`, seguir `PROJECT_RULES.md`, ejecutar `TASKS.md`, respetar `TESTING_RULES.md`, no romper contratos backend, tipado estricto, no usar `any`, no duplicar lógica API. El resto del contenido actual debe conservarse salvo ajustes mínimos de coherencia por la nueva estructura. *depende del paso 2*
4. Fase 2 — Crear estructura `.github/instructions/`
   Crear `.github/instructions/` y añadir dos archivos con frontmatter válido según la especificación actual de Copilot:
   - `frontend.instructions.md` con `description` rica en keywords de React/Vite/UI/API client/contratos/payloads/400 Bad Request y `applyTo` orientado a `frontend/smart-economat-frontend/src/**/*.{ts,tsx}`.
   - `backend.instructions.md` con `description` rica en keywords de NestJS/TypeORM/DTO/guards/transacciones/contratos y `applyTo` orientado a `backend/smart-economat-backend/src/**/*.ts` y tests backend si se considera útil.
   Estas instrucciones deben ser específicas y complementarias, no duplicar la instrucción global. *paralelo con paso 5 una vez fijada la fuente global*
5. Fase 3 — Materializar documentos raíz obligatorios
   Mover `.github/ARCHITECTURE.md` a `ARCHITECTURE.md` en raíz, preservando su contenido actual y completando solo lo que falte para cubrir explícitamente: estructura frontend, estructura backend, capa API, flujo de datos y contratos backend como fuente de verdad. Crear los archivos faltantes `AGENT_PLAN.md`, `PROJECT_RULES.md`, `TASKS.md` y `TESTING_RULES.md` en raíz con contenido profesional inicial basado en material ya existente del repo. *depende del paso 3 para que las referencias del global apunten a rutas definitivas*
6. Fase 3 — Repartir contenido desde fuentes existentes sin sobrescribir
   Reutilizar contenido y lenguaje del repo en vez de inventar:
   - `AGENT_PLAN.md`: fases de auditoría, refactor, validación, testing y verificación final.
   - `PROJECT_RULES.md`: no romper UI, no cambiar backend sin contrato, tipado estricto, centralizar API client.
   - `TASKS.md`: auditar requests, corregir payloads, alinear DTOs, refactor hooks, eliminar 400 Bad Request.
   - `TESTING_RULES.md`: validar requests, no permitir 400, validar tipos, validar schemas.
   Los nuevos documentos deben ser concisos y enlazables; si alguna de estas materias ya está parcialmente cubierta en contenido existente, se referencia y se resume sin duplicar demasiado. *paralelo con paso 4*
7. Fase 4 — Ajustar referencias internas
   Actualizar en `.github/copilot-instructions.md` y, si aplica, en los nuevos `.instructions.md` cualquier mención a la arquitectura o reglas para que apunten a los documentos raíz y no a rutas obsoletas. También revisar que ninguna instrucción activa siga apuntando a `AGENTS.md` si ya fue desactivado. *depende de los pasos 2, 4 y 5*
8. Fase 4 — Mantener el alcance estrictamente acotado
   No borrar ni alterar `.agent/**`, `.github/prompts/**`, `.github/skills/**` ni código fuente del backend/frontend, salvo que alguna referencia mínima en las nuevas instrucciones necesite enlazar estos artefactos. El árbol `.agent/` quedará como legado fuera del circuito oficial de Copilot, pero sin eliminarse. *aplica durante toda la ejecución*
9. Fase 5 — Verificación estructural y de contenido
   Verificar que existen exactamente en la estructura objetivo activa:
   - `.github/copilot-instructions.md`
   - `.github/instructions/frontend.instructions.md`
   - `.github/instructions/backend.instructions.md`
   - `ARCHITECTURE.md`
   - `AGENT_PLAN.md`
   - `PROJECT_RULES.md`
   - `TASKS.md`
   - `TESTING_RULES.md`
   Verificar además por búsqueda de texto que cada archivo contiene sus puntos mínimos requeridos y que los `.instructions.md` tienen frontmatter válido con `description` y `applyTo`.
10. Fase 5 — Verificación de seguridad de cambios
   Confirmar que no hay marcadores de conflicto, que el diff quedó limitado a estructura de instrucciones/documentación prevista y que no se han tocado archivos fuente fuera del alcance. Dado que no se modifica runtime ni build scripts, la verificación principal aquí es documental/estructural más que de compilación.

**Relevant files**
- `/home/psych/projects/SmartEconomat/.github/copilot-instructions.md` — mantener como única instrucción global activa y añadir el bloque canónico superior con referencias a documentos raíz.
- `/home/psych/projects/SmartEconomat/.github/ARCHITECTURE.md` — mover a raíz preservando el contenido actual, que ya cubre buena parte de la arquitectura.
- `/home/psych/projects/SmartEconomat/AGENTS.md` — desactivar como instrucción activa mediante renombrado a documento no operativo; reutilizar su contenido como fuente para reglas/plan/testing.
- `/home/psych/projects/SmartEconomat/wiki/architecture/frontend.md` — fuente para reforzar estructura frontend y flujo de datos/contratos.
- `/home/psych/projects/SmartEconomat/wiki/architecture/backend.md` — fuente para reforzar capa backend y API.
- `/home/psych/projects/SmartEconomat/wiki/reference/api.md` — fuente para la regla “backend como fuente de verdad” y contratos.
- `/home/psych/projects/SmartEconomat/wiki/development/convenciones.md` — fuente para reglas de tipado, DTOs y estilo.
- `/home/psych/projects/SmartEconomat/wiki/development/testing/frontend-backend-contracts-e2e.md` — fuente para tareas/testing orientados a payloads y 400 Bad Request.
- `/home/psych/projects/SmartEconomat/.agent/instructions.md` — legado fuera de alcance; no tocar salvo referencia explícita posterior.
- `/home/psych/projects/SmartEconomat/.github/instructions/` — directorio a crear para instrucciones por área con frontmatter moderno.
- `/home/psych/projects/SmartEconomat/ARCHITECTURE.md` — destino raíz obligatorio de arquitectura.
- `/home/psych/projects/SmartEconomat/AGENT_PLAN.md` — nuevo documento raíz obligatorio.
- `/home/psych/projects/SmartEconomat/PROJECT_RULES.md` — nuevo documento raíz obligatorio.
- `/home/psych/projects/SmartEconomat/TASKS.md` — nuevo documento raíz obligatorio.
- `/home/psych/projects/SmartEconomat/TESTING_RULES.md` — nuevo documento raíz obligatorio.

**Verification**
1. Confirmar con búsqueda de archivos que la estructura final activa contiene `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md` y los cinco Markdown raíz obligatorios.
2. Confirmar por búsqueda de texto que `.github/copilot-instructions.md` contiene todas las directivas mínimas pedidas y que los documentos raíz contienen sus bloques mínimos esperados.
3. Validar que `frontend.instructions.md` y `backend.instructions.md` tienen frontmatter correcto con `description` y `applyTo`.
4. Revisar diff final para asegurar que no se modificó código fuente ni se tocaron cambios ajenos ya presentes en `wiki/**` u otras rutas no objetivo.
5. Comprobar que no existen marcadores de conflicto Git en los archivos intervenidos.
6. Comprobar que `AGENTS.md` ya no queda como instrucción activa, evitando la doble fuente global con `.github/copilot-instructions.md`.

**Decisions**
- Se moverán los archivos objetivo; no se copiarán.
- Se crearán ambas instrucciones por área: frontend y backend.
- `AGENTS.md` debe salir del circuito activo para alinearse con la especificación actual de Copilot.
- `.agent/**` queda fuera de alcance y se mantiene como legado sin eliminar.
- No se sobrescribe contenido existente salvo añadidos mínimos críticos o adaptación de referencias.
- La verificación principal será estructural y documental, porque el alcance excluye cambios de runtime y código fuente.

**Further Considerations**
1. Riesgo residual: dejar `.agent/**` intacto evita borrar archivos, pero mantiene duplicados legacy para humanos; no afectará a la configuración oficial si la fuente activa queda solo en `.github/`.
2. Cuidado operativo: `.github/ARCHITECTURE.md` está abierto y tiene cambios sin confirmar; al moverlo habrá que preservar exactamente ese contenido antes de cualquier retoque mínimo.
3. Recomendación editorial: la instrucción global debe quedar corta y referencial en la cabecera, usando los documentos raíz como fuentes canónicas para no seguir duplicando contexto en varios sitios.