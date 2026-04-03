## Plan: Seeders HTTP Puros

Migrar las precondiciones internas del seeder masivo a orquestación sobre endpoints públicos existentes siempre que el contrato ya lo permita, y añadir la superficie HTTP mínima que falta para bootstrap/roles/permisos/reset determinista. En paralelo, cubrir con tests específicos la subida de imágenes OpenFoodFacts, el estado de incidencias y la selección segura de stock para mermas.

**Steps**
1. Fase 1. Encapsular las precondiciones actuales en una capa de helpers HTTP del seeder sin cambiar todavía el orden funcional. El objetivo es aislar el uso directo de AppDataSource en `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.runtime.requests.ts`, `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.runtime.deletables.ts`, `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.runtime.actors.ts`, `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.helpers.identity.ts`, `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.runtime.state-refresh.ts` y `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/seed-context.ts`. Esta fase bloquea el resto porque fija interfaces de migración estables.
2. Fase 2. Migrar los helpers ya sustituibles por contratos públicos existentes. `ensureOpenFoodFactsPool()` debe usar `GET /proveedor` y `GET /productos` con paginación para deduplicación; `ensureDeletableRecepcionResource()` debe pasar a `POST /recepciones`; `ensureDeletableProductoAlergenoResource()` a lectura del producto y `POST /producto-alergenos/:productoId/:alergeno`; `activateUserByIdentity()` a `GET /usuarios` más `PATCH /usuarios/:id/activar`. Esta fase puede ejecutarse en paralelo con la fase 3 donde no haya solape de ficheros.
3. Fase 3. Migrar precondiciones de stock usando endpoints ya disponibles. `ensureProductoWithSufficientStockForMerma()` debe reutilizar `GET /inventario/stock?consolidado=true` para seleccionar producto y cantidad seguras; `ensurePreparacionIngredientsHaveStock()` debe reorquestarse con `GET /preparaciones/:id`, `GET /recetas/:id/detalle` o el detalle público equivalente, `GET /inventario/stock`, `GET /inventario`, `POST /inventario` y `PATCH /inventario/:id` para completar/ajustar stock sin tocar repositorios. Esta fase depende de la fase 1.
4. Fase 4. Añadir la superficie HTTP mínima que hoy falta para cumplir HTTP puro estricto en bootstrap y seguridad. Aquí entra definir endpoints públicos o seed-safe para crear/activar roles del sistema, crear permisos seed si faltan, bootstrap inicial del admin o equivalente one-shot, y obtener/consumir de forma determinista el token de reset sin escribir columnas OTP por TypeORM. Esta fase depende de la fase 1 y bloquea la fase 5.
5. Fase 5. Reemplazar `upsertSeedUserViaRepository()`, `ensureUserAdditionalPermission()`, `ensureSeedRoleIds()`, `ensureBootstrapAdminCredentials()`, `ensureResetActor()` y los `update()` de OTP/reset en `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.runtime.state-refresh.ts` por los endpoints definidos en la fase anterior. El seeder debe fallar explícitamente si el contrato bootstrap no está disponible o devuelve datos inconsistentes. Esta fase depende de la fase 4.
6. Fase 6. Añadir tests específicos. Unitarios sobre `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/openfoodfacts.seed.ts` para descarga, caché, timeouts, content-type y multipart; unitarios sobre el filtrado/cola de incidencias a partir de `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.helpers.state-collection.ts` y del flujo de resolución usado por el seeder; e integración sobre la selección segura de stock para merma reutilizando `GET /inventario/stock` y `POST /merma`. Las subfases de test pueden ejecutarse en paralelo una vez estabilizados los helpers migrados.
7. Fase 7. Verificación final. Ejecutar build del backend, lint de los ficheros tocados, las suites nuevas, la suite existente de `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/recepcion.seeder.spec.ts` y una corrida real de `npm run seed`. Cualquier warning legacy no relacionado que permanezca debe documentarse, pero la fase no se da por cerrada hasta que el seed complete de extremo a extremo.

**Relevant files**
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.runtime.requests.ts` — foco principal de migración de precondiciones (`ensureOpenFoodFactsPool`, `ensurePreparacionIngredientsHaveStock`, `ensureProductoWithSufficientStockForMerma`).
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.runtime.deletables.ts` — recursos borrables hoy creados por repositorio.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.runtime.actors.ts` — bootstrap de usuarios seed, roles, permisos y reset actors.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.helpers.identity.ts` — activación de usuarios por identidad.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.runtime.state-refresh.ts` — refresco de estado y manipulación actual de OTP/reset.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/seed-context.ts` — bootstrap admin inicial.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/openfoodfacts.seed.ts` — seam principal para tests de imágenes OFF y caché.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/http-seed.catalog.ts` — patrón reutilizable de HTTP puro y cobertura adicional.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/inventario/controller/inventario.controller.ts` — confirma reutilización de `GET /inventario/stock` y `PATCH /inventario/:id`.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/admin/controller/admin.controller.ts` — endpoints admin actuales y huecos de bootstrap.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/auth/controller/auth.controller.ts` — recuperación/reset de contraseña y posible superficie bootstrap/reset seed-safe.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/recepcion.seeder.spec.ts` — patrón actual de tests de seeders.

**Verification**
1. Ejecutar build completo del backend y confirmar cero errores de compilación.
2. Ejecutar lint únicamente sobre los ficheros tocados en seeders y endpoints auxiliares de bootstrap.
3. Ejecutar las suites unitarias nuevas de OpenFoodFacts, incidencias y merma, además de la suite existente de recepciones.
4. Ejecutar `npm run seed` y validar que la corrida sigue cubriendo los 215 endpoints del flujo masivo sin caer en TypeORM directo para precondiciones migradas.
5. Revisar que no queden accesos `AppDataSource` o `getRepository` dentro de los helpers migrados, salvo los explícitamente aplazados por una fase posterior si se decide partir la entrega.

**Decisions**
- Se asume migración estricta a HTTP puro; está aceptado añadir endpoints públicos o seed-safe cuando no exista equivalente actual.
- Antes de proponer un endpoint nuevo de agregación para stock, se debe reutilizar `GET /inventario/stock` con `consolidado=true`, ya disponible.
- La parte más sensible de la migración es bootstrap/roles/permisos/reset; debe resolverse como contrato explícito del backend, no con excepciones silenciosas en el seeder.
- La cobertura de tests debe combinar unitarios para lógica de cliente seed e integración para los flujos donde importan locks, transacciones o multipart real.

**Further Considerations**
1. El primer corte ejecutable recomendable es completar fases 2, 3 y 6 sobre helpers ya sustituibles, dejando bootstrap/roles/permisos/reset como subentrega separada si se quiere reducir riesgo.
2. Si se implementa un endpoint bootstrap, debe estar claramente acotado a entorno de desarrollo/seed y con guardas explícitas para no ampliar superficie de ataque innecesariamente.
3. Las advertencias legacy de `any` en seeders auxiliares no bloquean esta fase, pero conviene no mezclarlas con la migración HTTP pura para mantener el diff controlado.
