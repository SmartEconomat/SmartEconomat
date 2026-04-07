# Badge / Chip de Estado (StatusChip)

El componente `StatusChip` es un indicador visual compacto que sirve para mostrar estados, metadatos descriptivos de las categorías o etiquetas identificativas. Encapsula y envuelve la funcionalidad del componente `Chip` base de Material UI introduciendo una lógica automática de resolución de colores, lo que fomenta configuraciones estéticas de estilo consistentes a lo largo del frontend.

## Propósito
- Categorizar entidades en función  su "Salud" de forma semántica automática (Verde para el éxito, Rojo para error, Amarillo para esperas/advertencias).
- Soporte de Categorías: Detección automática de categorías de productos para añadir iconos temáticos (Verdura, Carne, etc.) y nombres traducidos.
- Facilitar la escalabilidad insertando este generador en tablas analíticas (`DataTable`) o en visores de Entidad única sin necesidad de tener condicionales o switch repetitivos distribuidos.

## Interfaz de Props (StatusChipProps)

El componente extiende casi todas las Props nativas de un `Chip` de Material UI exceptuando la Prop `color`, que ahora es resuelta iterativamente de forma abstracta por la Prop `status`.

| Propiedad | Tipo | Por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `status` | `StatusType | string` | Requerido | El estado puro analítico. Según su naturaleza se le asignará la paleta adecuada. |
| `label` | `string` | Opcional | Texto explícito en el globo. Si no se provee, se dibujará el string `status` capitalizado y sin barras bajas. |
| `size` | `'small' | 'medium'` | `"small"` | Fuerza visual geométrica compactada por defecto (Acorde al Atomic Design). |
| `variant` | `'filled' | 'outlined'` | `"filled"` | Estética interna (Relleno completo o borde con fondo transparente). |

### Diccionario de Mapeo Interno de `StatusType`

| Tipo Devuelto | Equivalencias (`status`) |
| :--- | :--- |
| **success** | `'success'`, `'completed'`, `'delivered'`, `'approved'`, `'fácil'`, `'entrada'`, `'entrada_compra'` |
| **error** | `'error'`, `'failed'`, `'cancelled'`, `'rejected'`, `'difícil'`, `'salida'`, `'salida_elaboracion'` |
| **warning** | `'warning'`, `'pending'`, `'in_progress'`, `'review'`, `'media'`, `'ajuste'` |
| **info** | `'info'`, `'active'`, `'archived'`, `'pedido'` |
| **default** | Cualquier _string_ ajeno que caiga por defecto (`'unknown'`, `'custom'`). |

## Ejemplo de Integración en un DataTable

Comúnmente se usará inyectándolo en las columnas renderizables para agilizar desarrollo condicional sin acoplar lógicas de visualización:

\`\`\`tsx
import StatusChip from '@/components/ui/StatusChip';

// Configurando la tabla de Pedidos...
const columns = [
  { id: 'id', label: 'Nº Pedido' },
  { id: 'fecha', label: 'Fecha Emisión' },
  {
      id: 'estado',
      label: 'Estado',
      align: 'center',
      render: (row) => (
          // El string de Base de Datos es inyectable y auto-resolveable.
          // Por ejemplo si row.status es 'pending', se vuelve amarillo.
          <StatusChip status={row.status} variant="outlined" />
      ),
  }
];

\`\`\`

## Uso Rápido 

\`\`\`tsx
import React from 'react';
import { Stack } from '@mui/material';
import StatusChip from '@/components/ui/StatusChip';

export const ResumenEntidad = () => {
    return (
        <Stack direction="row" spacing={1}>
            {/* Imprimirá 'Review' con fondo relleno amarillo */}
            <StatusChip status="review" />
            
            {/* Imprimirá 'Fallido de red' con un color rojo y bordeado */}
            <StatusChip status="failed" label="Fallido de red" variant="outlined" />

            {/* Imprimirá 'Aprobado' y heredará iconografía adjunta (Prop nativa MUI) */}
            <StatusChip status="approved" icon={<CheckIcon />} />
        </Stack>
    )
}
\`\`\`
