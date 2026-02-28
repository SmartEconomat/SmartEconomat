# Select Components

Un componente genérico envoltorio de `Select` de Material-UI para mantener la coherencia visual con el resto de la interfaz (como `Input.tsx` y `Button.tsx`).

## Ubicación
`src/components/ui/Select.tsx`

## Propiedades (Props)

Hereda todas las propiedades de `SelectProps` de Material-UI, además define:

| Propiedad | Tipo | Obligatorio | Descripción |
| :--- | :--- | :---: | :--- |
| `label` | `string` | Sí | Texto de la etiqueta del selector. |
| `name` | `string` | Sí | Nombre del campo, útil para formularios y accesibilidad. |
| `options` | `SelectOption[]` | Sí | Array de objetos `{ value: string \| number, label: string }` con las opciones disponibles. |
| `helperText` | `string` | No | Texto de ayuda que aparece debajo del selector. |

## Uso básico

```tsx
import React, { useState } from 'react';
import Select from '../components/ui/Select';

export const MiFormulario = () => {
  const [categoria, setCategoria] = useState('');

  const categorias = [
    { value: 'bebidas', label: 'Bebidas' },
    { value: 'lacteos', label: 'Lácteos' },
    { value: 'limpieza', label: 'Limpieza' },
  ];

  return (
    <Select
      label="Categoría"
      name="categoria"
      value={categoria}
      options={categorias}
      onChange={(e) => setCategoria(e.target.value as string)}
      helperText="Seleccione una categoría para el producto"
      required
    />
  );
};
```
