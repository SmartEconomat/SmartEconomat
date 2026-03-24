# How-to: Generar y aplicar migración

## Nota del proyecto
El backend dispone de script `migration:run`, pero en desarrollo se usa frecuentemente `DB_SYNC=true`. Esta guía describe el flujo recomendado para evolución controlada de esquema.

## Pasos
1. Desactiva sincronización automática para validar migraciones.
2. Crea o ajusta archivo de migración TypeORM.
3. Ejecuta la migración.
4. Verifica estado de tablas e índices.

## Comandos útiles
```bash
npm run migration:run
npm run schema:sync
npm run schema:drop
```

## Flujo recomendado
1. Cambiar entidad.
2. Preparar migración correspondiente.
3. Ejecutar `npm run migration:run`.
4. Ejecutar smoke test de endpoints impactados.

## Buenas prácticas
- Una migración por cambio lógico.
- Evita mezclar refactors grandes con datos de negocio.
- Versiona y revisa SQL generado antes de producción.
