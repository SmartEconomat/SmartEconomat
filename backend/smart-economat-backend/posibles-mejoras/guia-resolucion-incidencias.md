# Guía de Resolución: Estado de Incidencias y Relaciones

Este documento describe la solución técnica recomendada para corregir la falta de sincronización del estado de resolución de incidencias en el frontend y la carga de datos del proveedor.

## 1. Problema Identificado

- La propiedad `resuelta` de la entidad `Incidencia` es una propiedad calculada (getter) que no se transfiere automáticamente al JSON de respuesta.
- La relación `pedido.proveedor.nombre` no se muestra porque no se está cargando de forma profunda en las consultas al repositorio.
- Existen conflictos de validación de UUID cuando se intenta resolver desde el frontend si el `usuarioId` se espera en el cuerpo de la petición pero debería extraerse del token JWT.

## 2. Solución Recomendada (Backend)

### A. Exponer Propiedades Virtuales en la Entidad

Modificar `src/modules/incidencia/incidencia.entity/incidencia.entity.ts`:

1. Importar `Expose` de `class-transformer`.
2. Añadir `@Expose()` al getter `resuelta`.
3. Crear un getter `proveedorNombre` con `@Expose()` que devuelva `this.pedido?.proveedor?.nombre`.

```typescript
import { Expose } from 'class-transformer';

// ... dentro de la clase Incidencia
  @Expose()
  get resuelta(): boolean {
    return !!this.fechaResolucion;
  }

  @Expose()
  get proveedorNombre(): string | undefined {
    return this.pedido?.proveedor?.nombre;
  }
```

### B. Cargar Relaciones Profundas en el Repositorio

Modificar `src/modules/incidencia/repository/incidencia.repository.ts`:
Asegurar que los métodos `findAllWithRelations` y `findOneWithRelations` incluyan la cadena de relación `'pedido.proveedor'`.

```typescript
// Ejemplo en findAllWithRelations
return this.find({
  relations: [
    'recepcion',
    'pedido',
    'pedido.proveedor', // Relación profunda necesaria
    'usuarioResolutor',
    'lineas',
  ],
  order: { createdAt: 'DESC' },
});
```

### C. Manejo Correcto del Usuario Resolutor

Para evitar errores de validación de UUID:

1. En el `IncidenciaController`, usar el decorador `@GetUser('id')` para extraer el ID del usuario directamente del token JWT.
2. Asignar este ID al DTO **dentro del método del controlador** antes de pasarlo al servicio.
3. El `ResolverIncidenciaDto` debe tener el campo `usuarioId` como `@IsOptional()` si se va a inyectar programáticamente.

## 3. Consideraciones Globales

- **No modificar** la configuración global de `ValidationPipe` en `main.ts` (mantener `forbidNonWhitelisted: true`). Es preferible ajustar los DTOs específicos para que coincidan con la realidad del frontend.
- **Mantener las rutas**: No eliminar endpoints `POST` si el frontend ya los está utilizando, incluso si existe una alternativa en `/auth/register`.

---

## Prompt Sugerido para IA (Copiar y Pepar)

> "Necesito corregir la sincronización del estado de las incidencias. Por favor:
>
> 1. En la entidad `Incidencia`, importa `Expose` de `class-transformer` y marca el getter `resuelta` con `@Expose()`. Además, crea un getter `proveedorNombre` que exponga `this.pedido?.proveedor?.nombre`.
> 2. En `IncidenciaRepository`, actualiza las relaciones en `findAllWithRelations` y `findOneWithRelations` para incluir `'pedido.proveedor'`.
> 3. En `IncidenciaController`, asegúrate de que el método `resolver` asigne el ID del usuario del token (`@GetUser('id')`) al DTO de resolución.
> 4. Asegúrate de que el DTO `ResolverIncidenciaDto` permita que `usuarioId` sea opcional para evitar fallos de validación antes de la asignación manual."
