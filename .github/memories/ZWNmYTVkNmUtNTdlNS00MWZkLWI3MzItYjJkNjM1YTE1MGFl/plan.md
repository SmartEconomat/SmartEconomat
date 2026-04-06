## Plan: Seeders Deterministas y Realistas Backend

Convertir exclusivamente la capa de seeders para que toda la generación de datos de negocio sea determinista, reproducible y realista, manteniendo intacta la lógica de dominio, contratos y orden de ejecución existente. La estrategia recomendada es eliminar fuentes no deterministas (faker aleatorio, Date.now, randomUUID, Math.random y datos externos variables), y reemplazarlas por catálogos explícitos y secuencias fijas basadas en listas locales del repositorio.

**Steps**
1. Fase 1 - Base determinista transversal (bloqueante)
2. Crear utilidades deterministas en seeders para fechas, sufijos, tokens y números secuenciales sin usar Date.now, Math.random ni randomUUID.
3. Sustituir runTag/suffix dinámicos en el flujo masivo por identificadores estables (o derivados determinísticamente de iteration y cursores), manteniendo el mismo flujo y los mismos endpoints.
4. Mantener el orden de ejecución actual sin alterarlo: seed.cli -> runMassiveSeeder y seed.ts -> seedersInOrder.
5. Fase 2 - Sustitución de datos mock por catálogos realistas (depende de Fase 1)
6. Reemplazar proveedores dinámicos por arrays explícitos de proveedores reales y consistentes, con contactos/teléfonos/emails deterministas.
7. Reemplazar nombres/atributos de producto generados dinámicamente por catálogo local fijo de alimentos reales usando los JSON de datos-base-economato y filtrado determinista por categorías alimentarias.
8. Reemplazar textos lorem, observaciones y descripciones aleatorias por plantillas realistas estáticas (listas cíclicas por iteration).
9. Reemplazar cantidades/precios/mermas aleatorias por tablas de valores realistas y coherentes con unidad/tipo.
10. Fase 3 - Recetas reales y coherencia global (depende de Fase 2)
11. Definir un catálogo de recetas reales (incluyendo Tortilla española, Paella valenciana, Croquetas de jamón, Patatas bravas, Ensaladilla rusa, Gazpacho andaluz, Salmorejo, Pollo al ajillo, Hamburguesa completa, Pizza margarita) usando enums actuales de receta.
12. Mapear ingredientes de recetas únicamente a productos existentes del seed, con unidades y cantidades realistas y sin selección aleatoria.
13. Garantizar coherencia de producción/preparación/recepción: recetas usan producto existente, productos enlazan con proveedor existente, mermas dentro de límites reales de stock.
14. Fase 4 - Eliminación de dependencias no deterministas externas (depende de Fase 2)
15. Cambiar OpenFoodFacts en tiempo de ejecución por fuente local fija del repositorio para seed (sin fetch externo variable en ejecución de seed).
16. Mantener firmas y contratos actuales de funciones de seeding para no romper llamadas existentes en massive/runtime/helpers.
17. Fase 5 - Ajuste de seeders directos y tareas HTTP (paralelo interno, depende de Fases 2-4)
18. Actualizar seeders directos con aleatoriedad (receta, recepcion, merma) para usar listas y secuencias fijas.
19. Actualizar tareas de http-seed.catalog con valores deterministas equivalentes, sin cambiar rutas, orden ni contratos.
20. Asegurar que cambios para DELETE precreados, colas de estados de pedido/recepción e incidencias conservan la lógica actual ya validada.
21. Fase 6 - Auditoría de cumplimiento y validación final (depende de Fases 1-5)
22. Ejecutar auditoría estática para verificar ausencia de APIs prohibidas en seeders de negocio (Math.random, Date.now, randomUUID, faker no controlado).
23. Verificar reproducibilidad funcional: ejecutar seed dos veces y comprobar estabilidad en campos de negocio (aceptando variación de id/createdAt de BD).
24. Ejecutar validación técnica completa en orden: build, lint, tests unitarios/e2e relevantes y seed end-to-end.

**Relevant files**
- [backend/smart-economat-backend/src/seeders/seed.cli.ts](backend/smart-economat-backend/src/seeders/seed.cli.ts) - Entrada principal de seed actual (runMassiveSeeder), mantener flujo y multiplicador.
- [backend/smart-economat-backend/src/seeders/seed.ts](backend/smart-economat-backend/src/seeders/seed.ts) - Orden canónico de seeders HTTP, no alterar secuencia.
- [backend/smart-economat-backend/src/seeders/massive.ts](backend/smart-economat-backend/src/seeders/massive.ts) - RunTag, trazas y ciclo principal masivo.
- [backend/smart-economat-backend/src/seeders/massive.helpers.body.shared.ts](backend/smart-economat-backend/src/seeders/massive.helpers.body.shared.ts) - Suffix y contexto de payloads deterministas.
- [backend/smart-economat-backend/src/seeders/massive.helpers.body.ts](backend/smart-economat-backend/src/seeders/massive.helpers.body.ts) - Fallback body sin faker aleatorio.
- [backend/smart-economat-backend/src/seeders/massive.helpers.body.catalog.ts](backend/smart-economat-backend/src/seeders/massive.helpers.body.catalog.ts) - Proveedores/productos/historial de precio con listas reales.
- [backend/smart-economat-backend/src/seeders/massive.helpers.body.inventory-production.ts](backend/smart-economat-backend/src/seeders/massive.helpers.body.inventory-production.ts) - Recetas, inventario, incidencias, mermas y albaranes deterministas.
- [backend/smart-economat-backend/src/seeders/massive.helpers.body.orders.ts](backend/smart-economat-backend/src/seeders/massive.helpers.body.orders.ts) - Recepciones/pedidos con fechas y textos ya deterministas, completar donde aplique.
- [backend/smart-economat-backend/src/seeders/massive.helpers.body.auth-users.ts](backend/smart-economat-backend/src/seeders/massive.helpers.body.auth-users.ts) - Nombres y slots sin faker aleatorio.
- [backend/smart-economat-backend/src/seeders/massive.runtime.actors.ts](backend/smart-economat-backend/src/seeders/massive.runtime.actors.ts) - Usuarios/tokens/runTag de actores admin-profesor-alumno deterministas.
- [backend/smart-economat-backend/src/seeders/massive.runtime.state-refresh.ts](backend/smart-economat-backend/src/seeders/massive.runtime.state-refresh.ts) - Regeneración de token OTP y fechas sin aleatoriedad.
- [backend/smart-economat-backend/src/seeders/massive.runtime.requests.ts](backend/smart-economat-backend/src/seeders/massive.runtime.requests.ts) - Multipart refs, fechas de inventario y otros campos dinámicos.
- [backend/smart-economat-backend/src/seeders/massive.runtime.deletables.ts](backend/smart-economat-backend/src/seeders/massive.runtime.deletables.ts) - Recursos eliminables con nombres/fechas deterministas.
- [backend/smart-economat-backend/src/seeders/seed-context.http-utils.ts](backend/smart-economat-backend/src/seeders/seed-context.http-utils.ts) - Backoff sin jitter aleatorio.
- [backend/smart-economat-backend/src/seeders/http-seed.catalog.ts](backend/smart-economat-backend/src/seeders/http-seed.catalog.ts) - Tareas HTTP con datos realistas y deterministas.
- [backend/smart-economat-backend/src/seeders/openfoodfacts.seed.ts](backend/smart-economat-backend/src/seeders/openfoodfacts.seed.ts) - Sustitución de origen externo variable por catálogo local fijo para seed.
- [backend/smart-economat-backend/src/seeders/producto.seeder.ts](backend/smart-economat-backend/src/seeders/producto.seeder.ts) - Seed directo de productos alineado con origen local determinista.
- [backend/smart-economat-backend/src/seeders/receta.seeder.ts](backend/smart-economat-backend/src/seeders/receta.seeder.ts) - Recetas e ingredientes sin selección aleatoria.
- [backend/smart-economat-backend/src/seeders/recepcion.seeder.ts](backend/smart-economat-backend/src/seeders/recepcion.seeder.ts) - Payloads de recepción sin faker aleatorio.
- [backend/smart-economat-backend/src/seeders/merma.seeder.ts](backend/smart-economat-backend/src/seeders/merma.seeder.ts) - Mermas deterministas y coherentes con stock.
- [backend/smart-economat-backend/src/seeders/datos-base-economato/catalogo.productos-normalizados.json](backend/smart-economat-backend/src/seeders/datos-base-economato/catalogo.productos-normalizados.json) - Fuente local realista de productos normalizados para seed.
- [backend/smart-economat-backend/src/seeders/datos-base-economato/lista.productos-normalizados.json](backend/smart-economat-backend/src/seeders/datos-base-economato/lista.productos-normalizados.json) - Catálogo alternativo local para selección estable.

**Verification**
1. Auditoría estática en seeders: confirmar cero ocurrencias funcionales de Math.random, Date.now, randomUUID y faker aleatorio en archivos de generación de datos.
2. Ejecutar build backend: npm run build.
3. Ejecutar lint backend: npm run lint.
4. Ejecutar seed completo: npm run seed.
5. Re-ejecutar seed y validar estabilidad de campos de negocio en recursos clave (usuarios seed, proveedores, productos base, recetas, pedidos, recepciones) con criterio de equivalencia por contenido, no por id/createdAt.
6. Ejecutar tests unitarios relevantes de cuentas seed: npx jest --runInBand test/modules/alumno/alumno.service.spec.ts test/modules/usuario/usuario.service.spec.ts.
7. Ejecutar e2e de cuentas seed: npm run test:e2e:file -- test/e2e/password-recovery.e2e-spec.ts test/e2e/profesores.e2e-spec.ts test/e2e/slots-admin.e2e-spec.ts.
8. Validar disponibilidad API local tras seed: curl -sf http://localhost:3000/api/v1 >/dev/null.

**Decisions**
- Determinismo aceptado sobre campos de negocio; id y createdAt generados por BD pueden variar entre ejecuciones.
- Fuente de productos para seed: catálogo local fijo del repositorio, sin dependencia en tiempo real de OpenFoodFacts durante ejecución de seed.
- Alcance incluido: solo archivos dentro de backend/smart-economat-backend/src/seeders y datos bajo ese árbol.
- Alcance excluido: entidades, servicios, repositorios, DTOs, enums, migraciones, relaciones y lógica de dominio.
- Se preserva el orden actual de ejecución y dependencias entre seeders.
