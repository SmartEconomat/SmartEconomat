## Plan: Mejora del Modal Auditar Stock

Mejorar el modal de auditoría para que sea visualmente más claro y operacionalmente seguro: mostrar cantidades de referencia en solo lectura y permitir un único campo editable por lote llamado “Ajuste de stock (+/-)”. El impacto en inventario se aplicará por delta usando el endpoint manual ya existente, evitando edición directa de cantidad total o cantidad absoluta del lote.

**Steps**
1. Fase 1 — Contrato y tipado (bloquea fases 2 y 3)
2. Crear en frontend un método de servicio para enviar ajustes manuales al endpoint POST /inventario/ajustes-manuales usando baseFetch y manejo de errores homogéneo. *Paralelo con paso 3*.
3. Definir tipos frontend para payload de ajuste manual y tipo de movimiento permitido en auditoría (entrada y salida_ajuste). *Paralelo con paso 2*.
4. Fase 2 — Rediseño visual del modal (depende de fase 1)
5. En modo auditoría, reemplazar el editor de cantidad absoluta por tres zonas por fila: Stock actual (solo lectura), Ajuste de stock (+/-) (editable), Stock resultante (solo lectura calculado en cliente).
6. Mejorar claridad de interacción con microcopy estable: “Positivo suma stock, negativo descuenta stock”, y mostrar unidad cuando exista.
7. Ajustar jerarquía visual de cabecera y columnas para distinguir claramente información de referencia frente a información editable.
8. Fase 3 — Lógica de guardado por lote (depende de fases 1 y 2)
9. Cambiar la acción Guardar para enviar delta de ajuste manual por lote, derivando tipo por signo (entrada si ajuste > 0, salida_ajuste si ajuste < 0).
10. Definir motivo estándar de auditoría desde modal y mantener observaciones opcionales fuera de alcance en esta iteración.
11. Aplicar validaciones de usabilidad y precisión: bloquear ajuste 0, NaN, vacío y ajustes que dejen stock resultante negativo; mantener estado de carga por fila y feedback toast consistente.
12. Fase 4 — Integración en página de inventario (depende de fase 3)
13. Mantener Stock Total como dato exclusivamente de visualización en la tabla agregada y asegurar que el flujo de auditoría no permita editarlo directa ni indirectamente.
14. Revisar textos del acceso al modal para que reflejen ajuste por delta y evitar ambigüedad con “edición de total”.
15. Fase 5 — Verificación (depende de fases 1-4)
16. Ejecutar lint y build de frontend para validar tipado, imports y consistencia de UI.
17. Validar manualmente en Inventario el flujo completo: ajuste positivo, ajuste negativo, bloqueo de inválidos y refresco correcto del stock tras cada guardado.

**Relevant files**
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/components/inventario/InventoryDetailModal.tsx — Rediseño de tabla/modal y nueva interacción de ajuste por lote.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/inventario.service.ts — Nuevo método de ajuste manual y reutilización del cliente API central.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/inventario.types.ts — Tipos de payload/enum para ajuste manual sin any.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/pages/Inventario.tsx — Texto y coherencia de entrada al modal, manteniendo Stock Total como solo lectura.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/inventario/controller/inventario.controller.ts — Referencia del contrato consumido por frontend, sin cambios.
- /home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/inventario/dto/create-movimiento-manual.dto.ts — Validaciones obligatorias de ajuste y motivo a respetar desde UI.

**Verification**
1. Desde /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend ejecutar npm run lint.
2. Desde /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend ejecutar npm run build.
3. Abrir Inventario y entrar en Auditar Stock para un producto con lotes.
4. Confirmar visualmente que Stock Total y Stock actual no son editables.
5. Introducir +N en Ajuste de stock (+/-), guardar y validar incremento tras recarga.
6. Introducir -N válido, guardar y validar decremento tras recarga.
7. Probar 0, vacío, no numérico y ajuste que llevaría a negativo, verificando bloqueo y mensaje claro.
8. Confirmar que no existe edición directa de cantidad absoluta en modo auditoría.

**Decisions**
- Ajuste por lote, no ajuste global por producto.
- Campo editable único: Ajuste de stock (+/-).
- Se reutiliza backend existente de ajustes manuales; no hay cambios de contrato backend.
- El botón Reportar Merma permanece sin cambios funcionales en este alcance.

**Scope boundaries**
- Incluye: UX del modal de auditoría, lógica de envío de ajustes manuales, validaciones de entrada y coherencia visual.
- Excluye: rediseño del flujo de merma, cambios de permisos backend, cambios de DTO/backend, y reestructuración global de la tabla principal de inventario.