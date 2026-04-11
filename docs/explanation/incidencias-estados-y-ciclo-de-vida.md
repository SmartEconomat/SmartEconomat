# Explicación: Incidencias, estados y ciclo de vida

## Qué problema resuelve este módulo

El módulo de incidencias existe para gestionar discrepancias entre lo pedido y lo recibido sin perder trazabilidad operativa ni contable.

En términos de negocio, una incidencia responde a una pregunta: "¿qué hacemos con esta diferencia para poder cerrar correctamente la compra y el inventario?"

## Por qué hay dos niveles de estado

SmartEconomat modela dos planos distintos:

1. Estado global de incidencia (`nueva`, `en_ajuste`, etc.).
2. Estado de reclamación de cada línea (`PENDIENTE`, `RECLAMADO`, etc.).

El estado global orienta la gestión del caso completo.
El estado por línea refleja el avance granular con proveedor y cantidades.

## Qué representa cada estado global

### `nueva`

La discrepancia existe y aún no se inició gestión manual.
Es el estado de entrada normal cuando se detecta diferencia en recepción.

### `en_ajuste`

Ya hubo intervención operativa en alguna línea, pero la incidencia no está lista para cerrar.
Suele indicar negociación o correcciones en curso.

### `pendiente_validacion`

Técnicamente las líneas ya están balanceadas, pero todavía no se cerró formalmente.
Sirve como "antesala de cierre" para revisión final.

### `resuelta`

La incidencia se cerró formalmente con resolutor y fecha.
Es el cierre estándar cuando no hay motivo para catalogarla como cancelada o inválida.

### `cancelada`

La incidencia se cierra como no aplicable o descartada por decisión operativa.
No expresa que el problema técnico no existiera, sino que se decide no continuar su tratamiento.

### `invalida`

La incidencia no es válida para el flujo esperado (por ejemplo, inconsistencia de datos o estructura anómala).
Puede aparecer también como señal de anomalía técnica.

## Cuándo ocurre cada estado en el flujo real

1. Se reporta o crea incidencia con discrepancias: `nueva`.
2. Se empieza a gestionar línea a línea: `en_ajuste`.
3. Se equilibran cantidades, sin cierre formal: `pendiente_validacion`.
4. Se ejecuta cierre formal: `resuelta`.
5. Si el cierre indica descarte: `cancelada`.
6. Si el cierre indica invalidez o no hay líneas: `invalida`.

## Por qué el backend usa marcadores textuales para estados terminales

El estado terminal `cancelada`/`invalida` se reconoce por marcadores en `observacionesResolucion`.
Esto permite:

1. Mantener compatibilidad con flujos previos.
2. Preservar trazabilidad humana del motivo en texto libre.

Trade-off:

- Ventaja: flexibilidad y retrocompatibilidad.
- Coste: hay que estandarizar lenguaje operativo para evitar ambigüedad.

## Diferencia entre resolver estándar y resolver transaccional

`PATCH /incidencias/:id/resolver`:

- Flujo principal para ajustes por línea y cierre explícito.
- Permite estados terminales manuales.

`POST /incidencias/:id/resolver`:

- Flujo de cierre transaccional con tipo de resolución (`aceptada`, `devolucion`, etc.).
- Registra trazabilidad adicional en `incidencia_resuelta`.

Ambos caminos cierran incidencia, pero su intención funcional no es idéntica.

## Cómo leer los estados para tomar decisiones

- Operación diaria:
  - Priorizar `nueva` y `en_ajuste`.
  - Usar `pendiente_validacion` como cola de cierre.

- Control y auditoría:
  - Revisar `cancelada` e `invalida` para detectar patrones de datos o proceso.
  - Distinguir claramente cierre válido (`resuelta`) de cierre descartado (`cancelada`) o anómalo (`invalida`).

## Señales de riesgo operacional

- Muchas incidencias en `en_ajuste` durante largos periodos.
- Volumen alto de `invalida`.
- Uso inconsistente de observaciones de cierre.

Estas señales suelen indicar necesidad de reforzar procedimiento de recepción o calidad del dato de entrada.
