# How-to: Implementar soft-delete en un nuevo recurso

## Contexto
El backend usa borrado lógico para mantener trazabilidad y permitir restauraciones controladas.

## Pasos
1. Extender `BaseEntity` compartida.
2. Usar `repository.softDelete(id)` en lugar de `delete` físico.
3. Exponer restauración si el caso lo requiere (`repository.restore(id)`).
4. Ajustar consultas administrativas con `withDeleted` cuando proceda.

## Ejemplo
```ts
async remove(id: string) {
  await this.repo.softDelete(id);
}

async restore(id: string) {
  await this.repo.restore(id);
}
```

## Validación
- Verifica que el registro no aparece en listados estándar.
- Verifica que sigue disponible para auditoría administrativa.
