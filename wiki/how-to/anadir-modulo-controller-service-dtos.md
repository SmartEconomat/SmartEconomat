# How-to: Añadir módulo + controller + service + DTOs

## Objetivo
Crear un nuevo módulo de dominio siguiendo la convención del backend.

## Pasos
1. Crea estructura:
   - `src/modules/mi-modulo/mi-modulo.module.ts`
   - `controller/mi-modulo.controller.ts`
   - `service/mi-modulo.service.ts`
   - `dto/create-mi-modulo.dto.ts`
   - `dto/update-mi-modulo.dto.ts`
2. Registra controller y service en el módulo.
3. Añade el módulo en `AppModule`.
4. Expone rutas bajo prefijo `/api/v1`.

## Esqueleto de módulo
```ts
@Module({
  imports: [TypeOrmModule.forFeature([MiEntidad])],
  controllers: [MiModuloController],
  providers: [MiModuloService],
  exports: [MiModuloService],
})
export class MiModuloModule {}
```

## Recomendaciones
- Mantén nombres en singular/plural consistentes.
- Aplica DTO por endpoint, no DTO genérico para todo.
- Añade permisos por acción desde el inicio.
