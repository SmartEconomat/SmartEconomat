# Fix disponibilidad produccion recetas (2026-05-07)

- Contexto: el boton de iniciar preparacion/lote en recetas podia quedar deshabilitado aunque hubiese stock suficiente.
- Causa raiz: `ProduccionService.validarMultiple` agregaba requerimientos por `productoId` sin convertir unidades entre recetas. En lotes, un mismo producto usado como `kg` y `g` podia sumarse como magnitudes incompatibles, generando falsos faltantes.
- Ajuste aplicado: la validacion convierte cada requerimiento a la unidad agregada antes de sumar y reutiliza el mismo calculo de cantidad bruta que ejecucion, incluyendo `mermaAplicada`.
- Regla futura: cualquier cambio en disponibilidad de produccion debe mantener alineados `/produccion/validar` y `/produccion/ejecutar` para evitar falsos negativos en UI y falsos positivos al confirmar.
- Continuacion UI: el modal de recetas tambien quedaba bloqueado si se abria antes de terminar `UbicacionService.findAll()`. El selector mostraba placeholder vacio y `!cookData.ubicacionId` deshabilitaba el boton aunque stock estuviera OK. `Recetas.tsx` debe autoseleccionar la primera ubicacion valida cuando las ubicaciones llegan tarde con el modal abierto.
- Verificacion: `npx jest test/modules/receta/produccion.service.spec.ts --runInBand`, `npm run build`, y `npx eslint src/modules/receta/service/produccion.service.ts test/modules/receta/produccion.service.spec.ts`.
- Verificacion frontend adicional: `npx tsc -b --pretty false`, `npx vitest run test/pages/Recetas.test.tsx --pool=forks`, `npx eslint src/pages/Recetas.tsx test/pages/Recetas.test.tsx src/services/produccion.service.ts`, `npx vite build`.
