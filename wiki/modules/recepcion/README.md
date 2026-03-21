# 📦 Recepción de Productos — SmartEconomat

> Módulo de Recepción para la Escuela de Cocina.  
> Trazabilidad alimentaria completa: entradas de stock, incidencias automáticas y persistencia de borradores.

---

## 📂 Documentos

| # | Fichero | Contenido |
|---|---------|-----------|
| 1 | [arquitectura-ui.md](./arquitectura-ui.md) | Detalle de fraccionamiento de la UI de React de Recepcion.tsx en componentes pequeños. |
| 2 | [recepcion-masiva.md](./recepcion-masiva.md) | Documentación sobre recepión masiva/pedidose elásticos. |

---

## ⚡ Flujo Resumido

```
[Frontend]  Wizard 4 pasos (Borrador persistente) → 1 POST atómico
                                     │
               ┌─────────────────────┘
               │ Transacción ACID (backend)
               ├── ① INSERT recepcion
               ├── ② INSERT recepcion_pedido[]   (vínculos N:M)
               ├── ③ INSERT recepcion_producto[]  (líneas con cotejo)
               │── ④ INSERT inventario[]          AUTO — Entrada de stock
               │── ⑤ INSERT movimiento[]          AUTO — ENTRADA
               │── ⑥ INSERT incidencia[]          AUTO — si hay diferencias
               └── ⑦ UPDATE pedido.estado         AUTO — RECIBIDO / INCIDENCIA
```

## 🔑 Principios de Diseño

- **Borrador Persistente (Auto-save)**: El frontend sincroniza el estado de la recepción con el servidor en tiempo real. Al recargar la página, se recupera el punto exacto donde lo dejó el usuario (excepto si finaliza).
- **Una sola llamada**: El frontend construye todo el payload y lo envía con un único POST.
- **Trazabilidad automática**: Inventario, movimientos e incidencias se generan en la misma transacción, sin acción adicional del usuario.
- **Comprobante PDF**: Generación instantánea de reporte PDF al finalizar, detallando lo recibido y posibles incidencias.
- **Recepciones parciales**: Un pedido puede recepcionarse en varias entregas; permanece EN_PROCESO hasta completarse.
- **Gestión de Stock**: Cada línea aceptada crea un registro de `Inventario` y genera un `Movimiento` de entrada asociado.
