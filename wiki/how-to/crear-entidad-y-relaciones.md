# How-to: Crear una entidad con relaciones TypeORM

## Cuándo usar esta guía
Cuando necesitas modelar una nueva tabla y enlazarla con entidades existentes.

## Pasos
1. Crear archivo de entidad en el módulo de dominio.
2. Definir tabla con `@Entity`.
3. Declarar columnas con tipos, nullability e índices.
4. Añadir relaciones (`ManyToOne`, `OneToMany`, `ManyToMany`, `OneToOne`).
5. Registrar la entidad en `TypeOrmModule.forFeature([...])` del módulo.
6. Actualizar DTOs y service.
7. Añadir pruebas unit/e2e.

## Ejemplo base
```ts
@Entity({ name: 'mi_entidad' })
export class MiEntidad extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @ManyToOne(() => Usuario, (u) => u.misEntidades, { onDelete: 'SET NULL' })
  usuario: Relation<Usuario>;
}
```

## Recomendaciones
- Usa `BaseEntity` común para auditoría homogénea.
- Define `@Index` en campos de búsqueda frecuente.
- Evita cascadas no necesarias en relaciones críticas.

## Verificación
- Sincroniza esquema (`npm run schema:sync`) en dev.
- Ejecuta tests del módulo afectado.
