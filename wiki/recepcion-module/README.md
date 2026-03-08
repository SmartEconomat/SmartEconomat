# 📦 Recepción de Productos — SmartEconomat

> Módulo de Recepción para la Escuela de Cocina.  
> Trazabilidad alimentaria completa: lotes, inventario FEFO, incidencias automáticas.

---

## 📂 Documentos

| # | Fichero | Contenido |
|---|---------|-----------|
| 1 | [01-dominio-y-backend.md](./01-dominio-y-backend.md) | Análisis DDD, Aggregate Roots... |
| 2 | [02-frontend.md](./02-frontend.md) | Formulario wizard, estado local, validaciones... |
| 3 | [03-diagramas.md](./03-diagramas.md) | UML clases, casos de uso, secuencia **FE** + secuencia **BE**... |
| 4 | [arquitectura_ui.md](./arquitectura_ui.md) | Detalle de fraccionamiento de la UI de React de Recepcion.tsx en componentes pequeños. |

---

## ⚡ Flujo Resumido

```
[Frontend]  Wizard 3 pasos → 1 POST atómico
                                    │
               ┌────────────────────┘
               │ Transacción ACID (backend)
               ├── ① INSERT recepcion
               ├── ② INSERT recepcion_pedido[]   (vínculos N:M)
               ├── ③ INSERT recepcion_producto[]  (líneas con cotejo)
               │── ④ INSERT inventario[]          AUTO — lote FEFO
               │── ⑤ INSERT movimiento[]          AUTO — ENTRADA
               │── ⑥ INSERT incidencia[]          AUTO — si hay diferencias
               └── ⑦ UPDATE pedido.estado         AUTO — RECIBIDO / INCIDENCIA
```

## 🔑 Principios de Diseño

- **Una sola llamada**: el frontend construye todo el payload y lo envía con un único POST.
- **Trazabilidad automática**: inventario, movimientos e incidencias se generan en la misma transacción, sin acción adicional del usuario.
- **Recepciones parciales**: un pedido puede recepcionarse en N entregas; permanece EN_PROCESO hasta completarse.
- **Incidencias automáticas**: si `cantidad_recibida ≠ cantidad_pedida`, el backend crea una `Incidencia` con snapshot JSONB inmutable de las diferencias.
- **FEFO**: cada línea aceptada crea un registro de `Inventario` propio con `fecha_caducidad`, ordenado para consumo FEFO (First Expired, First Out).
