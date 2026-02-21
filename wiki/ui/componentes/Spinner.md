# Spinner

Componente dinámico de carga, construido sobre `CircularProgress` de Material UI. Este componente soporta múltiples colores, tamaños y la capacidad de actuar como un *overlay* (capa superpuesta) sobre contenedores específicos o la pantalla completa.

## Ubicación
`src/components/ui/Spinner.tsx`

## Propiedades (Props)

El componente acepta las siguientes propiedades opcionales:

| Propiedad | Tipo | Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Determina el tamaño del spinner (24px, 40px o 56px respectivamente). |
| `color` | `'primary'` \| `'white'` \| `'gray'` | `'primary'` | Especifica el color del spinner. `'primary'` usa el color principal del tema, `'gray'` usa el gris por defecto de MUI y `'white'` es blanco puro. |
| `overlay` | `boolean` \| `'container'` \| `'screen'`| `false` | Convierte el spinner en un *overlay* con fondo semitransparente. Si es `true` o `'container'`, debe envolverse en un padre con `position: relative`. Si es `'screen'`, cubrirá toda la pantalla bloqueando la interacción. |
| `className` | `string` | `undefined` | Permite inyectar clases CSS personalizadas para aplicar estilos adicionales o ajustar márgenes. |

## Ejemplos de uso

### Uso Básico
Muestra un spinner simple que se adapta al flujo de la vista.
```tsx
import Spinner from '@/components/ui/Spinner';

// Por defecto (tamaño mediano, color primario)
<Spinner />

// Personalizado
<Spinner size="lg" color="gray" />
```

### Uso como Overlay en un Contenedor
Al usar `overlay`, el spinner se centra sobre un fondo semitransparente que cubre completamente su contenedor base. 
**Importante:** Asegúrate de que el contenedor padre tenga un estilo que incluya `position: relative` para que funcione correctamente.

```tsx
import Spinner from '@/components/ui/Spinner';

const MiComponente = () => (
    <div style={{ position: 'relative', width: '300px', height: '200px', border: '1px solid #ccc' }}>
        <p>Contenido del cuadro que puede estar o no de fondo.</p>
        
        {/* Esto bloqueará el contenido del div y mostrará un círculo de carga */}
        <Spinner overlay color="primary" size="md" />
    </div>
);
```

### Uso como Overlay a Pantalla Completa
En operaciones globales (como guardar un formulario principal o un intento de inicio de sesión), puedes bloquear toda la pantalla. Usa la prop `overlay="screen"`. El contenedor se fija (fixed positioning) y aplica un z-index alto sobre el resto de la interfaz.

```tsx
import React, { useState } from 'react';
import Spinner from '@/components/ui/Spinner';

const PaginaLogin = () => {
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async () => {
        setCargando(true);
        // ... (Tu lógica de llamada HTTP)
        setCargando(false);
    }

    return (
        <div>
            <h1>Formulario de ingreso</h1>
            <button onClick={handleSubmit}>Entrar</button>

            {/* Spinner en toda la pantalla */}
            {cargando && <Spinner overlay="screen" size="lg" color="white" />}
        </div>
    );
};
```

## Accesibilidad
El componente incluye los siguientes atributos para asegurar el funcionamiento con lectores de pantalla:
- `role="status"`
- `aria-label="Cargando"`
