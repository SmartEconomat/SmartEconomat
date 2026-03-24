# How-to: Añadir logging estructurado

## Objetivo
Introducir logs útiles para soporte y trazabilidad sin ruido innecesario.

## Pasos
1. Declara `private readonly logger = new Logger(NombreClase.name)`.
2. Registra inicio y fin de operaciones sensibles.
3. Incluye contexto funcional (id usuario, id entidad, operación).
4. Usa `logger.error` con stack en excepciones capturadas.

## Ejemplo
```ts
this.logger.log(`Creando pedido para usuario=${userId}`);
try {
  // lógica
} catch (error) {
  this.logger.error(`Fallo al crear pedido user=${userId}`, error.stack);
  throw error;
}
```

## Buenas prácticas
- No loguear secretos (tokens, passwords).
- Evitar payloads completos si contienen datos sensibles.
- Correlacionar con `x-request-id` cuando aplique.
