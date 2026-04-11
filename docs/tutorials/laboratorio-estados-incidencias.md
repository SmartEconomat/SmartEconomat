# Tutorial: Laboratorio completo de estados de incidencias

En este tutorial vas a recorrer el ciclo de vida de una incidencia y verás cómo producir sus estados en un entorno de pruebas.

## Qué vas a aprender

Al terminar, podrás:

1. Crear una incidencia reproducible.
2. Llevarla por `nueva`, `en_ajuste`, `pendiente_validacion` y `resuelta`.
3. Producir cierres `cancelada` e `invalida`.
4. Verificar el resultado en API con criterios objetivos.

## Contexto del laboratorio

Necesitas una recepción con al menos una línea que no cuadre con la cantidad esperada.

Variables que usarás:

- `INCIDENCIA_ID`
- `RECEPCION_ID`
- `PEDIDO_ID`
- `PEDIDO_PRODUCTO_ID`

## Paso 1: Crear incidencia manual

Request: `POST /api/v1/incidencias`

```json
{
  "recepcionId": "RECEPCION_ID",
  "pedidoId": "PEDIDO_ID",
  "observacionesRecepcion": "Laboratorio estados incidencia",
  "lineas": [
    {
      "pedidoProductoId": "PEDIDO_PRODUCTO_ID",
      "cantidadEsperada": 10,
      "cantidadRecibida": 7,
      "tipoDiferencia": "FALTANTE",
      "observaciones": "Llegaron menos unidades"
    }
  ]
}
```

Comprobación:

1. Guarda el `id` devuelto como `INCIDENCIA_ID`.
2. Consulta `GET /api/v1/incidencias/INCIDENCIA_ID`.
3. Verifica `estado = nueva`.

## Paso 2: Mover a `en_ajuste`

Request: `PATCH /api/v1/incidencias/INCIDENCIA_ID/resolver`

```json
{
  "lineas": [
    {
      "pedidoProductoId": "PEDIDO_PRODUCTO_ID",
      "estadoReclamacion": "RECLAMADO",
      "observaciones": "Proveedor avisado"
    }
  ],
  "marcarComoResuelta": false
}
```

Comprobación:

1. `GET /api/v1/incidencias/INCIDENCIA_ID`.
2. Verifica `estado = en_ajuste`.

## Paso 3: Mover a `pendiente_validacion`

Request: `PATCH /api/v1/incidencias/INCIDENCIA_ID/resolver`

```json
{
  "lineas": [
    {
      "pedidoProductoId": "PEDIDO_PRODUCTO_ID",
      "cantidadRecibida": 10
    }
  ],
  "marcarComoResuelta": false
}
```

Comprobación:

1. `GET /api/v1/incidencias/INCIDENCIA_ID`.
2. Verifica `estado = pendiente_validacion`.

## Paso 4: Cerrar como `resuelta`

Request: `PATCH /api/v1/incidencias/INCIDENCIA_ID/resolver`

```json
{
  "estadoFinal": "resuelta",
  "marcarComoResuelta": true,
  "observacionesResolucion": "Cierre validado"
}
```

Comprobación:

1. `GET /api/v1/incidencias/INCIDENCIA_ID`.
2. Verifica `estado = resuelta`.
3. Verifica `fechaResolucion` informada.

## Paso 5: Escenario alternativo `cancelada`

Crea una nueva incidencia y aplica:

Request: `PATCH /api/v1/incidencias/NUEVA_INCIDENCIA_ID/resolver`

```json
{
  "estadoFinal": "cancelada",
  "marcarComoResuelta": true,
  "observacionesResolucion": "Caso duplicado"
}
```

Comprobación:

1. `GET /api/v1/incidencias/NUEVA_INCIDENCIA_ID`.
2. Verifica `estado = cancelada`.

## Paso 6: Escenario alternativo `invalida`

Crea otra incidencia y aplica:

Request: `PATCH /api/v1/incidencias/NUEVA_INCIDENCIA_ID_2/resolver`

```json
{
  "estadoFinal": "invalida",
  "marcarComoResuelta": true,
  "observacionesResolucion": "Datos de origen inconsistentes"
}
```

Comprobación:

1. `GET /api/v1/incidencias/NUEVA_INCIDENCIA_ID_2`.
2. Verifica `estado = invalida`.

## Bonus: cierre transaccional

Con incidencia abierta, ejecuta:

Request: `POST /api/v1/incidencias/INCIDENCIA_ID/resolver`

```json
{
  "accion": "aceptada",
  "observaciones": "Resolución transaccional de laboratorio"
}
```

Resultado esperado:

1. Estado final `resuelta`.
2. Registro de cierre en `incidencias-resueltas`.

## Qué puede salir mal

- No tienes líneas de incidencia: no podrás resolver.
- Intentas ajustar cantidad en línea ya balanceada: backend lo rechaza.
- Envías `cantidadRecibida` y `ajusteCantidad` juntos: validación de negocio falla.

## Resumen final

En este laboratorio comprobaste que:

1. El estado global no se escribe directamente, se deriva.
2. La resolución final y las observaciones determinan estados terminales.
3. El estado de línea influye en el estado global mientras no haya cierre.
