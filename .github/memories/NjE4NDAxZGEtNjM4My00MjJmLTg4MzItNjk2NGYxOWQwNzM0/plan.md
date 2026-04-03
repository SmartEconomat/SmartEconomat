## Plan: Blindaje keepMounted en Autocomplete

Corregir el warning de React evitando que la prop interna keepMounted se propague al DOM desde callbacks renderOption de MUI Autocomplete. La estrategia recomendada es mínima y localizada: sanear props en los 3 renderOption identificados, sin tocar la configuración global de tema ni contratos backend.

**Steps**
1. Fase 1 - Ajuste de renderOption en 3 componentes: en cada callback renderOption desestructurar props para extraer y descartar keepMounted antes del spread al elemento de lista. Mantener el resto de props funcionales (roles, aria, eventos, className) para no romper accesibilidad ni navegación por teclado.
2. Fase 1 - Conservación de key y tipado estricto: en los 3 callbacks, conservar key de forma explícita y aplicar tipado compatible con HTMLAttributes de li para evitar any y evitar que key/keepMounted entren en el spread final. Paralelo con el paso 1, archivo por archivo.
3. Fase 2 - Revisar coherencia con tema global: verificar que la configuración actual de a11y en temas (MuiMenu.defaultProps.keepMounted y MuiDrawer.defaultProps.ModalProps.keepMounted) se mantiene intacta; el fix debe quedar encapsulado en UI local y no en theme. Depende de 1.
4. Fase 3 - Prueba estática rápida del patrón: buscar en frontend renderOption con spread a elementos nativos y confirmar que no quedan casos de spread directo con keepMounted potencial. Depende de 1.
5. Fase 4 - Validación automatizada del frontend: ejecutar lint + build + tests del frontend para confirmar que el cambio no introduce regresiones. Depende de 1 y 2.
6. Fase 5 - Validación manual del warning: abrir las vistas que usan esos Autocomplete, interactuar (abrir dropdown, navegar con teclado, seleccionar opción) y confirmar en consola que desaparece el warning de keepMounted. Depende de 5.

**Relevant files**
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/components/ui/RecetaIngredientesSelector.tsx - renderOption en selector de ingredientes (actualmente li con spread directo).
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/components/ui/PedidoLineasSelector.tsx - renderOption en selector de líneas de pedido (actualmente li con spread directo).
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/productos/ProductFilters.tsx - renderOption con Box component="li" y spread de listItemProps (actualmente filtra key, no keepMounted).
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/utils/theme/themes.ts - referencia para no alterar defaults de accesibilidad global durante el fix.
- /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/components/ui/RecetaIngredientesSelector.test.tsx - base de pruebas existente para validar que el componente sigue renderizando correctamente.

**Verification**
1. Ejecutar búsqueda de control en frontend para confirmar eliminación de spread inseguro en renderOption de los tres casos detectados.
2. Ejecutar: cd frontend/smart-economat-frontend && npm run lint
3. Ejecutar: cd frontend/smart-economat-frontend && npm run build
4. Ejecutar: cd frontend/smart-economat-frontend && npm run test
5. Validación manual en UI: reproducir flujo en RecetaIngredientesSelector, PedidoLineasSelector y ProductFilters, verificando ausencia del warning en consola y comportamiento correcto de teclado/foco.

**Decisions**
- Alcance acordado con el usuario: blindar los 3 renderOption detectados, no solo el punto puntual donde apareció el warning.
- Se excluye explícitamente cambiar a minúsculas keepmounted o modificar la configuración global de tema como workaround.
- Se excluyen cambios backend (no aplican al problema).

**Further Considerations**
1. Si durante la validación manual aparece otro warning similar en un componente distinto, ampliar el barrido a todos los callbacks renderOption del frontend en la misma intervención para cerrar la clase completa de fallo.