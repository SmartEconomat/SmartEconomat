## Plan: Paginación real en Pedidos

La incidencia está en frontend, no en backend: `GET /pedido-usuarios` ya devuelve `PaginatedResponseDto` con `page`, `limit`, `total` y `totalPages`, y `fetchPedidoUsuarios()` ya envía esos parámetros. El problema real es que la pantalla Pedidos fuerza `page=1`, `limit=50`, fusiona páginas en cliente y luego deja la tabla sin paginación efectiva. La recomendación es un fix frontend-only, pequeño y enfocado, que respete el contrato actual y mantenga fuera de alcance lotes y recepción.

**Steps**
1. Baseline contractual: confirmar como fuente de verdad que `/api/v1/pedido-usuarios` ya soporta paginación y que el límite máximo permitido sigue siendo `50` por `PaginationQueryDto`. Este paso bloquea cualquier intento de tocar backend sin necesidad.
2. Corregir la capa de datos de Pedidos en `usePedidosData` (*depends on 1*): eliminar la lógica que fuerza `effectivePage=1` y `effectivePageSize=50` para la pestaña de pedidos propios, suprimir el `Promise.all` que descarga el resto de páginas y propagar directamente `data`, `total` y `totalPages` que devuelve backend. Mantener el comportamiento de tabs semanales o de lotes fuera del cambio salvo el refactor mínimo necesario para no romper el hook compartido.
3. Reajustar el wiring de la página `Pedidos.tsx` (*depends on 2*): dejar de pasar `page=1` y `totalPages=1` a `PedidosTable` en la vista tabular afectada, usar el total del backend en el contador visible y conservar los resets a página 1 cuando cambian búsqueda, tab o `pageSize`.
4. Reutilizar la UI existente en `PedidosTable.tsx` (*parallel with 3 once the hook contract is stable*): validar que la tabla ya acepta `currentPage`, `totalPages`, `pageSize` y callbacks correctos; tocar este archivo solo si hace falta algún ajuste menor de props o tipado. No rediseñar el componente.
5. Añadir cobertura de regresión frontend (*depends on 2, can run with 3*): crear una prueba para el hook o el contenedor de Pedidos que verifique que navegar de página cambia la request enviada a `fetchPedidoUsuarios()` en vez de precargar todas las páginas, y que cambiar `pageSize` respeta el máximo backend sin volver a aplanar resultados.
6. Verificación final (*depends on 2-5*): ejecutar build, lint y tests del frontend, y hacer una comprobación manual del flujo en la pantalla Pedidos para confirmar que cada cambio de página genera una única request paginada, que `search` resetea a página 1 y que la tabla refleja correctamente `totalPages`.

**Relevant files**
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/pedidos/hooks/usePedidosData.ts` — raíz del bug; contiene `effectivePageSize`, `effectivePage`, la descarga de páginas restantes y el cálculo incorrecto de `totalPages`.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/pages/Pedidos.tsx` — pasa `page` y `totalPages` a `PedidosTable`, resetea paginación al buscar/cambiar tab y hoy fuerza `1` para la vista afectada.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/features/pedidos/components/PedidosTable.tsx` — componente de tabla ya preparado para paginación; sirve como punto de validación y posible ajuste menor, no como origen del problema.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/pedido.service.ts` — referencia contractual del cliente; `fetchPedidoUsuarios()` ya serializa `page`, `limit`, `searchTerm`, `estado`, `sortBy` y `order`.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/controller/pedido-usuario.controller.ts` — referencia backend que confirma `GET /pedido-usuarios` paginado mediante `PedidoUsuarioQueryDto`.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/service/pedido-usuario.service.ts` — referencia backend que aplica `skip`, `take`, `getManyAndCount()` y devuelve `totalPages`.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/common/dto/pagination-query.dto.ts` — límite canónico `limit <= 50`; condiciona cualquier selector de tamaño de página.

**Verification**
1. `cd /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend && npm run build`
2. `cd /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend && npm run lint`
3. `cd /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend && npm run test`
4. Comprobación manual en la pantalla Pedidos: cambiar de página, cambiar `pageSize`, buscar y revisar que las requests salgan contra `/api/v1/pedido-usuarios?page=<n>&limit=<m>` sin fan-out de todas las páginas.
5. Comprobación manual de regresión: cambiar entre tabs de Pedidos y volver a la vista tabular para confirmar que el refactor del hook no rompe las vistas semanal o batch aunque sigan fuera de alcance funcional.

**Decisions**
- Incluido: corregir la paginación efectiva del listado/tablas de la pantalla Pedidos que consume `pedido-usuarios`.
- Excluido: paginar `purchase-batches`, cambiar la carga fija de `Recepcion.tsx` o modificar contratos backend; esos puntos son reales pero pertenecen a otro alcance.
- Límite técnico: el backend rechaza `limit > 50`, así que cualquier tamaño de página debe permanecer en ese rango.
- No debería requerir cambios de documentación ni de API pública, porque el contrato ya existe y el bug es de consumo en cliente.
- El worktree ya contiene cambios no relacionados en documentación/wiki; deben preservarse y no mezclarse con la incidencia de Pedidos.

**Further Considerations**
1. Si después de arreglar la tabla se quiere que el tab de lotes también pagine, eso ya requiere una tarea separada porque `GET /purchase-batches` hoy devuelve lista completa y no `PaginatedResponseDto`.
2. Si el tablero semanal necesita paginación real o carga incremental, conviene decidirlo aparte para no mezclar una corrección de bug con un rediseño de UX/datos.