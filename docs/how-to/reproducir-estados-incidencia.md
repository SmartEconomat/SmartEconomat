# How-to: Reproducir cada estado de incidencia

Esta guía está orientada a operación y desarrollo. Explica cómo llevar una incidencia a cada estado del sistema de forma controlada usando la API.

## Objetivo

Reproducir una incidencia en cualquiera de estos estados:

- `nueva`
- `en_ajuste`
- `pendiente_validacion`
- `resuelta`
- `cancelada`
- `invalida`

## Prerrequisitos

1. Usuario autenticado con permisos de incidencias.
2. Una `recepcionId` válida.
3. Al menos un `pedidoProductoId` de la recepción.
4. Base URL: `/api/v1`.

## Mapa rápido de reglas

- El estado global se calcula en backend.
- Una incidencia sin líneas queda `invalida`.
- Si está resuelta (`fechaResolucion` informada), por defecto es `resuelta`.
- Si en `observacionesResolucion` aparece `cancelad`, gana `cancelada`.
- Si en `observacionesResolucion` aparece `invalida` o `invalid`, gana `invalida`.
- Si no está resuelta y todas las líneas están balanceadas (`cantidadRecibida == cantidadEsperada`), queda `pendiente_validacion`.
- Si no está resuelta, tiene discrepancias y ninguna línea fue gestionada manualmente, queda `nueva`.
- Si no está resuelta y hay gestión manual de líneas (`estadoReclamacion != PENDIENTE`), queda `en_ajuste`.

## Paso 1: Crear una incidencia base

Usa `POST /incidencias`.

```json
{
  "recepcionId": "UUID_RECEPCION",
  "pedidoId": "UUID_PEDIDO",
  "observacionesRecepcion": "Diferencias detectadas en entrega",
  "lineas": [
    {
      "pedidoProductoId": "UUID_PEDIDO_PRODUCTO",
      "cantidadEsperada": 10,
      "cantidadRecibida": 8,
      "tipoDiferencia": "FALTANTE",
      "observaciones": "Faltan 2 unidades"
    }
  ]
}
```

Resultado esperado inicial: `estado = nueva`.

## Estado `nueva`

Condición:

1. Incidencia no resuelta.
2. Existen líneas.
3. Hay discrepancia en al menos una línea.
4. Ninguna línea marcada manualmente (`estadoReclamacion = PENDIENTE` en todas).

Cómo reproducir:

1. Crea incidencia con al menos una discrepancia.
2. No ejecutes resolución ni ajustes de línea.
3. Consulta `GET /incidencias/:id` y valida `estado = nueva`.

## Estado `en_ajuste`

Condición:

1. Incidencia no resuelta.
2. Sigue habiendo alguna discrepancia.
3. Al menos una línea pasa a `RECLAMADO`, `ABONADO` o `REENVIADO`.

Cómo reproducir:

1. Parte de una incidencia en `nueva`.
2. Llama `PATCH /incidencias/:id/resolver` con ajuste parcial:

```json
{
  "lineas": [
    {
      "pedidoProductoId": "UUID_PEDIDO_PRODUCTO",
      "estadoReclamacion": "RECLAMADO",
      "observaciones": "Reclamado al proveedor"
    }
  ],
  "marcarComoResuelta": false
}
```

3. Consulta incidencia y verifica `estado = en_ajuste`.

## Estado `pendiente_validacion`

Condición:

1. Incidencia no resuelta.
2. Todas las líneas quedan balanceadas.

Cómo reproducir:

1. Parte de una incidencia en `nueva` o `en_ajuste`.
2. Ajusta líneas sin cerrar explícitamente:

```json
{
  "lineas": [
    {
      "pedidoProductoId": "UUID_PEDIDO_PRODUCTO",
      "cantidadRecibida": 10
    }
  ],
  "marcarComoResuelta": false
}
```

3. Consulta incidencia y valida `estado = pendiente_validacion`.

## Estado `resuelta`

Condición:

1. Incidencia con `fechaResolucion` y sin marcador textual de cancelación/invalidez.

Cómo reproducir (flujo estándar):

1. Ejecuta `PATCH /incidencias/:id/resolver`.

```json
{
  "observacionesResolucion": "Ajuste completado con proveedor",
  "marcarComoResuelta": true,
  "estadoFinal": "resuelta"
}
```

2. Verifica `estado = resuelta`.

Cómo reproducir (flujo transaccional):

1. Ejecuta `POST /incidencias/:id/resolver`.

```json
{
  "accion": "aceptada",
  "observaciones": "Cierre transaccional"
}
```

2. Verifica `estado = resuelta`.

## Estado `cancelada`

Condición:

1. En observaciones de resolución existe token de cancelación (`[cancelada]`, `#cancelada` o texto que contenga `cancelad`).

Cómo reproducir:

1. Ejecuta `PATCH /incidencias/:id/resolver` con cierre terminal:

```json
{
  "observacionesResolucion": "Incidencia no procedente por duplicidad",
  "estadoFinal": "cancelada",
  "marcarComoResuelta": true
}
```

2. Backend añade marcador y la incidencia pasa a `cancelada`.

## Estado `invalida`

Condición:

1. Observaciones de resolución con token de invalidez (`[invalida]`, `#invalida`, `inválid`, `invalid`).
2. O incidencia sin líneas.

Cómo reproducir por cierre terminal:

1. Ejecuta `PATCH /incidencias/:id/resolver`:

```json
{
  "observacionesResolucion": "Datos de recepción inconsistentes",
  "estadoFinal": "invalida",
  "marcarComoResuelta": true
}
```

2. Verifica `estado = invalida`.

Cómo reproducir por estructura inválida:

1. Usa una incidencia existente y elimina todas sus líneas por vía de mantenimiento de datos.
2. Consulta incidencia y valida `estado = invalida`.

> [!WARNING]
> El camino de "incidencia sin líneas" es diagnóstico/técnico, no flujo operativo normal.

## Verificación estándar

Tras cada cambio, revisa:

1. `GET /incidencias/:id`
2. Campo `estado`.
3. Campo `resuelta`.
4. `fechaResolucion` y `observacionesResolucion`.

## Errores habituales y solución

- Error: "No se puede resolver una incidencia sin líneas de producto."
  Solución: añade o reconstruye líneas antes de resolver.

- Error: "No se pudo determinar el usuario resolutor de la incidencia."
  Solución: autentícate correctamente o envía `usuarioId` en DTO estándar.

- Error al ajustar líneas balanceadas.
  Solución: solo se permiten ajustes de cantidad en líneas con discrepancia.
