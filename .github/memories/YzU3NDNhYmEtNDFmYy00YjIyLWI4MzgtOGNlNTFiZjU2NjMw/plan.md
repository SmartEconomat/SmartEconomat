## Plan: Memoria Local del Proyecto

Asegurar que las memorias usadas en este workspace sean de alcance local del repositorio. La comprobación actual confirma que no hay memorias globales de usuario que migrar.

**Steps**
1. Auditar los tres ámbitos de memoria disponibles (usuario, sesión, repositorio) para verificar ubicación real de notas.
2. Confirmar si existe contenido en memoria global de usuario y migrarlo a repositorio solo si aparece contenido.
3. Establecer criterio operativo: en este proyecto, registrar nuevas notas únicamente en memoria de repositorio.
4. Mantener memoria de sesión solo para planificación temporal cuando sea necesario.

**Relevant files**
- /memories/ — raíz de ámbitos de memoria.
- /memories/repo/ — notas locales del proyecto.
- /memories/session/plan.md — plan activo de esta conversación.

**Verification**
1. Revisar que no existan archivos de notas bajo memoria global de usuario.
2. Verificar que las notas existentes estén en memoria de repositorio.
3. Confirmar que las futuras notas de esta conversación se guarden en repositorio si son persistentes del proyecto.

**Decisions**
- Alcance incluido: mover/usar memorias en ámbito local del repositorio para este workspace.
- Alcance excluido: cambios de configuración interna del producto fuera de las herramientas de memoria disponibles.
- Estado actual: no hay migración pendiente porque ya está en ámbito local de proyecto.
