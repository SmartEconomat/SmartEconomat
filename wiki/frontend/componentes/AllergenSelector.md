# AllergenSelector

El componente `AllergenSelector` ofrece una cuadrícula visual reutilizable para la selección de los 14 alérgenos alimentarios de declaración obligatoria según el reglamento de la Unión Europea (Reglamento UE 1169/2011).

Diseñado específicamente para interactuar limpiamente en interfaces densas (como modales de registro o edición de productos) reemplazando la necesidad de extensos arrays de checkboxes por un panel de iconos descriptivos.

## Props

El componente acepta la interfaz `AllergenSelectorProps`:

| Prop | Tipo | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `value` | `string[]` | Sí | Array de strings con los IDs de los alérgenos actualmente seleccionados. |
| `onChange` | `(newValue: string[]) => void` | Sí | Función callback que se dispara cuando el usuario marca o desmarca un alérgeno. Retorna el nuevo array con los IDs resultantes. |
| `disabled` | `boolean` | No | Si es `true`, oscurece el panel y previene interacciones (click o puntero). |

## Tipos de Datos (IDs de Alérgenos Soportados)

Los identificadores internos que expulsa y procesa el componente para cada alérgeno son estrictos y constantes:
`gluten`, `crustaceans`, `eggs`, `fish`, `peanuts`, `soybeans`, `milk`, `nuts`, `celery`, `mustard`, `sesame`, `sulphites`, `lupin`, `molluscs`

## Ejemplo de uso

Este componente no mantiene estado propio, debe ser controlado por el componente padre (Controlled Component Pattern).

```tsx
import React, { useState } from 'react';
import AllergenSelector from './AllergenSelector';

export default function MiFormularioProducto() {
    // El estado guarda un array puro de strings
    const [allergens, setAllergens] = useState<string[]>(['milk', 'peanuts']);

    const handleAllergenChange = (nuevosAlergenos: string[]) => {
        setAllergens(nuevosAlergenos);
        console.log("Alérgenos detectados:", nuevosAlergenos);
    };

    return (
        <AllergenSelector
            value={allergens}
            onChange={handleAllergenChange}
            disabled={false}
        />
    );
}
```

## Integración con DynamicFormModal
El `AllergenSelector` ha sido introducido nativamente dentro del componente abstracto `DynamicFormModal`. 

Para renderizar un selector de alérgenos automáticamente estructurado en un formulario dinámico, solo define el campo en el schema utilizando `type: 'allergens'`. Dado que este panel es visualmente pesado, se recomienda ubicarlo explícitamente debajo del recuadro de imagen utilizando `position: 'left'`.

```tsx
{ 
    name: 'misAlergenos', 
    label: 'Alérgenos Presentes', 
    type: 'allergens', 
    position: 'left' 
```
