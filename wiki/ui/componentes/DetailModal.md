# Componente visual genérico: DetailModal

El componente `DetailModal` es un diálogo estructurado de solo lectura para presentar detalladamente la información de una entidad (como un producto, un usuario, etc.) en un formato visual amigable, tabulado y semántico.

## Propósito

Ofrecer un layout consistente para ventanas modales de "Vista de Detalles" a lo largo de la aplicación.
- Permite renderizar cabecera con avatar o imagen destacada, con título y subtítulo automáticos y botón condicional de adición / edición.
- Permite construir una lista de "secciones" lógicas (`DetailSection`), donde cada sección funciona como una tarjeta que envuelve piezas de información agrupadas por área de interés.
- Permite layouts de cuadrícula flexibles, configurando un número de `columns` a nivel de sección y el número de columnas a ocupar (`colSpan`) en cada par lógico clave/valor (`DetailField`).
- Soporta el volcado libre de ReactNodes (`content`) dentro de las secciones para datos no convencionales, alérgenos encapsulados en chips flexibles, listas ricas, etc.

## Estructuras y Tipos

### `DetailField` (Campo individual)

Representa un par Etiqueta/Valor a mostrar:
- `label` (string): Etiqueta descriptiva del campo.
- `value` (ReactNode): Contenido dinámico renderizado.
- `fullWidth` (boolean opcional): Si es true, el campo forzará ocupar todo el espacio disponible (`colSpan = section.columns`).
- `colSpan` (number opcional): Número de columnas en la grilla que este campo tomará. Útil para campos muy anchos.

### `DetailSection` (Agrupador)

Representa una tarjeta blanca de la sección dentro del modal:
- `title` (string): El título principal de la sección.
- `columns` (number opcional): Define el total de la retícula de columnas CSS Grid de esta sección en pantallas medias y grandes. Por defecto es `1`.
- `fields` (`DetailField[]` opcional): Lista estática de los pares clave/valor.
- `content` (`ReactNode` opcional): Un nodo personalizado que desplaza e ignora los campos y ocupa libremente la caja de la sección.

## Props Principales (`DetailModalProps`)

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `isOpen` | `boolean` | Controla la visibilidad del componente modal en pantalla. |
| `onClose` | `() => void` | Evento invocado para cerrar el modal (clic en la X, en el esc o en el oscurecimiento). |
| `title` | `string` | Título grande encajado en lo más alto del modal. |
| `subtitle` | `string` | (Opcional) Subtítulo atado y más discreto por debajo del título. Puede reflejar una categoría o subestado. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | (Opcional) Define el ancho vertical máximo permitido para el modal. Predeterminado: `'md'`. |
| `onEdit` | `() => void` | (Opcional) Si se define, aparecerá un botón flotante de lápiz (Editar) en el extremo derecho del DialogTitle vinculado a esta acción. |
| `headerMedia` | `ReactNode` | (Opcional) Imagen / Avatar. Si existe, el DialogTitle reestructurará su flexbox para darle un lugar predominante al lado de sus textos correspondientes. |
| `sections` | `DetailSection[]` | (Obligatorio) Array en el que cada objeto instanciará una tarjeta (`Paper` sombreado) subdividiendo el espacio visual vertical. |

## Ejemplo de Uso (Simplificado)

```tsx
import { DetailModal } from '@/components/ui/DetailModal';

// ...
<DetailModal
    isOpen={Boolean(productToView)}
    onClose={() => setProductToView(null)}
    title={productToView.nombre}
    subtitle={productToView.marca}
    headerMedia={
        <Avatar src={productToView.pathImg} variant="rounded" sx={{ width: 80, height: 80 }} />
    }
    onEdit={() => handleEditClick(productToView)}
    sections={[
        {
            title: 'Información General',
            columns: 3, // Creará visualmente una tablilla a 3 columnas
            fields: [
                { label: 'Tipo', value: productToView.tipo },
                { label: 'Contenido', value: productToView.contenido },
                { label: 'Código de Barras', value: productToView.codigoBarras, fullWidth: true }, // Esto ocupará las 3 columnas y forzará línea nueva
            ]
        },
        {
            title: 'Contenido Libre Avanzado',
            content: (
                <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip label="Chip1" />
                    <Chip label="Chip2" />
                </Box>
            )
        }
    ]}
/>
```
