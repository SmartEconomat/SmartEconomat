## Plan: Seeders HTTP 2XX Strict en Ambos Flujos

Aplicar una política única de fail-fast para que cualquier request HTTP de seeding que no sea 2XX aborte la ejecución de inmediato, tanto en el catálogo clásico como en el seeder masivo. La implementación se basa en eliminar toda supresión de errores, reemplazar payloads/procesos que hoy provocan 4XX/5XX, y añadir validaciones automáticas para garantizar que no haya respuestas fuera de 2XX durante la ejecución.

**Steps**
1. Fase 1 - Contrato estricto central en contexto HTTP
1.1. Endurecer `SeedContext` para modo estricto por defecto en seeders HTTP: sin reintentos y con excepción inmediata al primer `!res.ok`. *Bloquea el resto de fases.*
1.2. Alinear inicialización de contexto en ambos flujos (`runAllSeeders` y `runMassiveSeeder`) para forzar `maxRetries=0` y comportamiento fail-fast homogéneo. *Depende de 1.1.*

2. Fase 2 - Eliminar tolerancia en catálogo clásico
2.1. Sustituir la semántica de `safe()` en el catálogo por ejecución estricta (sin retorno `null`, sin whitelist de 401/403/404/409/429/duplicados). *Depende de 1.1.*
2.2. Refactorizar `saveListIds()` y llamadas asociadas para no depender de fallback por error HTTP; resolver endpoint canónico por recurso sin inducir 400. *Depende de 2.1.*
2.3. Eliminar `catch` de supresión en tareas (usuarios/profesor/pedido/consolidación y similares) y convertirlos en precondiciones explícitas + error descriptivo. *Depende de 2.1.*
2.4. Reemplazar llamadas “dummy” o de alta probabilidad 4XX por flujos válidos que produzcan 2XX (auth reset/register, uploads, relaciones con IDs válidos, etc.). *Depende de 2.2 y 2.3.*
2.5. Donde no existan prerequisitos (IDs/tokens), fallar con error de negocio antes de llamar HTTP, en lugar de “omitir”. *Depende de 2.3.*

3. Fase 3 - Endurecer seed masivo
3.1. Cambiar `runMassiveSeeder()` para abortar al primer resultado no exitoso (`result.ok=false`) en vez de tolerar fallos dentro de bucles de intentos. *Depende de 1.1.*
3.2. Endurecer `executeAdminFocusEndpointRequest()` y `executeEndpointRequest()` para no convertir excepciones en éxitos parciales; cualquier no-2XX se propaga como fallo. *Depende de 3.1.*
3.3. Limpiar ramas muertas de “conflicto aceptable” y dejar el contrato explícito: sólo 2XX cuenta y cualquier otro status rompe ejecución. *Depende de 3.2.*

4. Fase 4 - Orquestación estricta
4.1. En `runSeedersWithContext`, eliminar la vía tolerante (`continueOnError`) para evitar ejecución parcial silenciosa.
4.2. Tratar ausencia de archivo seeder como error fatal en modo estricto (evitar que se salten seeders accidentalmente). *Puede ir en paralelo con 4.1.*

5. Fase 5 - Pruebas y validación
5.1. Añadir tests unitarios del contrato estricto en catálogo/contexto/runtime masivo (propagación de errores no-2XX, sin retries, fail-fast inmediato). *Depende de fases 1-4.*
5.2. Ejecutar build, lint y tests focalizados de seeders.
5.3. Ejecutar smoke real de ambos flujos y validar logs de requests para confirmar ausencia total de status no-2XX.

**Relevant files**
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/seed-context.ts` — contrato de request/retry/fail-fast (`request`, `postMultipart`, `HttpSeedRequestError`).
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/http-seed.catalog.ts` — eliminación de tolerancia (`safe`, `saveListIds`, tareas con catches y payloads dummy).
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.ts` — fail-fast al primer resultado no exitoso en bucles por endpoint.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/massive.runtime.ts` — ejecución por endpoint/admin sin conversiones tolerantes de error.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/seed.ts` — orquestación sin `continueOnError` ni omisiones silenciosas.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/seed.cli.ts` — verificación del flujo masivo por CLI.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/recepcion.seeder.ts` — fuera de alcance HTTP estricto salvo el camino `runNamedHttpSeeder('recepcion')`; mantener modo DB intacto.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/seeders/recepcion.seeder.spec.ts` — patrón base existente para nuevos tests de seeders.
- `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/package.json` — comandos de verificación (`build`, `lint`, `test`, `seed`).

**Verification**
1. `npm run build` en backend para validar compilación tras cambios.
2. `npm run lint` en backend para asegurar consistencia estática.
3. `npm test -- src/seeders` o patrón equivalente para tests de seeders/contexto.
4. Ejecutar catálogo clásico (entrada correspondiente en `seed.ts`) y confirmar aborta al primer no-2XX.
5. Ejecutar flujo masivo (`npm run seed -- 1`) y confirmar aborta al primer no-2XX.
6. Validar logs de requests (`seed-http-log.txt` y `seed-massive-requests.log`) sin status fuera de rango 2XX.

**Decisions**
- Alcance confirmado: aplicar estricto 2XX en ambos flujos de seeding HTTP.
- Política confirmada: fail-fast inmediato en 429/5XX también; sin reintentos.
- Criterio de aceptación: cero tolerancia a 400/401/403/404/409/429/5XX durante ejecución.

**Further Considerations**
1. Para endpoints de intención negativa (si existen), excluirlos del catálogo de seed de datos positivos o rediseñar payload válido para producir 2XX sin perder cobertura funcional.
2. Conviene añadir una validación automática post-run que falle si en logs aparece cualquier status no-2XX, para prevenir regresiones de tolerancia.