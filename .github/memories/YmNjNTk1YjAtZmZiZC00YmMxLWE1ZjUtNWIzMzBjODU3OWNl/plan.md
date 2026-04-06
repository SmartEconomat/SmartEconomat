## Plan: Clarificar raciones en Bolsa

Sustituir el rango `porcionesRestantes / porcionesProducidas` por un único valor operativo basado en `porcionesRestantes`, manteniendo intacto el cálculo backend y limitando el cambio a la tabla de Bolsa de Preparaciones para no tocar otros flujos fuera de lo pedido.

**Steps**
1. Implementar un formateador específico de raciones en `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/pages/Preparaciones.tsx` que use `row.porcionesRestantes` como fuente única y no modifique `formatLocalizedNumber()` global. Esto evita efectos colaterales en inputs de consumo, cantidades y otros módulos. 
2. Aplicar una regla de redondeo UX consistente en ese formateador: valores `< 10` con máximo `1` decimal; valores `10-99` redondeados a entero; valores `100-999` a la decena más cercana; valores `>= 1000` a la centena más cercana. El resultado debe devolverse siempre como una sola cifra legible, sin barras ni segundo valor.
3. Actualizar la definición de columna en `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/pages/Preparaciones.tsx` para reemplazar el render actual `X / Y` por el valor ya formateado y revisar el título de la columna. Recomendación: renombrarla a `Raciones disponibles`, porque el dato representará stock operativo actual y ya no el total producido.
4. Mantener el cambio estrictamente en la tabla `DataTable` de la página de Preparaciones. Quedan fuera del alcance el modal de detalle (`Raciones disponibles` dentro de `viewSections`) y el diálogo de consumo, para respetar la instrucción de no tocar nada más.
5. Añadir una prueba frontend enfocada en `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/test/pages/Preparaciones.test.tsx` reutilizando el estilo de mocks de `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/test/pages/Recetas.test.tsx`, validando que la columna muestra un único valor redondeado y que no aparece el separador `/`.

**Relevant files**
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/pages/Preparaciones.tsx` — definir el formateador local, cambiar el render de la columna y ajustar el encabezado.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/utils/numberUtils.ts` — reutilizarlo como base, pero no modificarlo salvo que durante la implementación aparezca un motivo fuerte; hoy su uso compartido lo hace arriesgado.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/test/pages/Preparaciones.test.tsx` — prueba nueva de regresión visual/funcional del formateo.
- `/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/test/pages/Recetas.test.tsx` — referencia de patrón de mocks y montaje de página con Vitest + RTL.

**Verification**
1. Ejecutar `cd /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend && npx eslint src/pages/Preparaciones.tsx test/pages/Preparaciones.test.tsx`.
2. Ejecutar `cd /home/psych/projects/SmartEconomat/frontend/smart-economat-frontend && npx vitest run test/pages/Preparaciones.test.tsx`.
3. Verificar manualmente en la UI que la tabla de `Bolsa de Preparaciones` muestra una única cifra por fila, sin formato `X / Y`, en ambas pestañas (`Disponibles` y `Agotadas`).
4. Confirmar manualmente que la columna refleja `porcionesRestantes` redondeadas y que el botón/flujo de consumo sigue funcionando sin cambios.
5. Tener en cuenta un fallo preexistente de suite global: `npm run build` y `npm test` pueden fallar por `test/store/AuthContext.test.tsx` importando `../../src/services/authService` (incidencia ya documentada en memoria del repo), por lo que la validación útil para este cambio debe ser focalizada.

**Decisions**
- Valor único confirmado por producto: mostrar `raciones disponibles ahora` (`porcionesRestantes`).
- El backend no se toca; el cálculo actual de `porcionesProducidas` y `porcionesRestantes` en `/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/receta/service/produccion.service.ts` queda fuera del alcance.
- El cambio se limita a la tabla; no se expandirá al modal de detalle ni al diálogo de consumo salvo nueva instrucción explícita.

**Further Considerations**
1. Si durante la revisión visual el redondeo `< 10` con un decimal sigue pareciendo demasiado preciso para cocina, la alternativa más simple es redondear siempre a entero en la tabla sin tocar el resto del plan.
2. Si se busca coherencia total del módulo en una iteración posterior, convendría aplicar la misma representación también en el modal de detalle y en los mensajes del diálogo de consumo, pero ahora queda excluido por alcance.