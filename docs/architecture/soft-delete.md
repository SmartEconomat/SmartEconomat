# Soft Delete Global - Arquitectura

El sistema implementa un mecanismo de **borrado lógico (Soft Delete)** de forma transversal en todas las entidades que heredan de `BaseEntity`. Esto permite "eliminar" registros de la vista del usuario sin borrarlos físicamente de la base de datos, facilitando la recuperación de datos y manteniendo la integridad referencial histórica.

## Implementación en el Modelo

### `BaseEntity`
Todas las entidades del sistema extienden `BaseEntity` (ubicada en `src/common/entities/base.entity.ts`), que incluye la columna necesaria para TypeORM:

```typescript
@DeleteDateColumn({
  type: 'timestamptz',
  name: 'deleted_at',
  nullable: true,
})
deletedAt?: Date | null;

@Column({
  type: 'uuid',
  nullable: true,
  name: 'deleted_by',
})
deletedBy?: string | null;
```

- **`deletedAt`**: Almacena la fecha del borrado. Si es `null`, el registro está activo.
- **`deletedBy`**: Almacena el ID del usuario que realizó la acción.

---

## Lógica en Servicios

El `BaseService` (`src/common/base/base.service.ts`) gestiona cómo se interactúa con estos registros:

### Borrado Lógico
El método `remove` utiliza `softRemove` de TypeORM, lo que dispara los listeners de la entidad y rellena automáticamente la columna `deletedAt`.

```typescript
async remove(id: string): Promise<void> {
  const entity = await this.findOne(id);
  await this.repository.softRemove(entity);
}
```

### Consultas y Visibilidad
TypeORM filtra automáticamente los registros donde `deletedAt` no es nulo. Sin embargo, el sistema permite que los administradores vean estos registros:

- **Usuarios normales**: Solo ven registros activos.
- **Administradores (ADMIN, SUPER_ADMIN)**: Ven registros activos y eliminados automáticamente en los métodos `findOne` y `findAll`.

**Ejemplo de implementación en `BaseService`:**
```typescript
const isAdmin = userRole?.toUpperCase() === 'ADMIN' || ...;

const entity = await this.repository.findOne({
  where: { id },
  withDeleted: isAdmin, // Condición clave
});
```

---

## Restauración de Datos

Para restaurar un registro eliminado, se debe limpiar la columna `deletedAt`. Actualmente, esto se realiza a nivel de servicio específico cuando se requiere la funcionalidad de "Deshacer" o "Restaurar".

---

## Ventajas del Soft Delete

1. **Seguridad**: Previene la pérdida accidental de datos críticos (recetas, pedidos, movimientos).
2. **Auditoría**: Permite saber quien borró qué y cuándo.
3. **Integridad**: Mantiene las relaciones ManyToOne intactas para reportes históricos sin necesidad de cascadas complejas que podrían corromper el estado del inventario.

---

## Relacionado
- [Diagrama de Datos](../architecture/data-model.md)
- [Sistema de Permisos](../security/rbac.md)
