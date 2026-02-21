# Modal Genérico

Componente de interfaz base para mostrar cuadros de diálogo superpuestos a la aplicación utilizando `React Portals` (`createPortal`). Al renderizar el componente fuera de la jerarquía DOM principal de la aplicación (directamente en `document.body`), asegura que problemas de apilamiento (z-index) o de posicionamiento (`overflow: hidden`) en ancestros no lo oculten ni recorten.

## Ubicación
`src/components/ui/Modal.tsx`

## Características
1. **Pulsación en Fondo (Backdrop Click):** Permite cerrar el modal haciendo clic fuera de la caja principal del mismo.
2. **Tecla ESC:** Manejo predeterminado para cerrar presionando la tecla Escape.
3. **Bloqueo de Desplazamiento (Scroll Lock):** Desactiva automáticamente el scroll en la página completa al abrirse, para prevenir dobles barras espaciadoras o problemas de navegación.
4. **Transiciones Suaves:** Aparece al desvanecerse (fade-in) apoyado en librerías de `Material UI`.

## Propiedades (Props)

| Propiedad | Tipo | Valor por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `isOpen` | `boolean` | **Requerido** | Determina la visibilidad de todo el flujo (true: abierto). |
| `onClose` | `() => void` | **Requerido** | Función ejecutada cuando se cierra haciendo clic en la X, el backdrop, o pulsando ESC. |
| `title` | `string \| ReactNode` | `undefined` | Título del menú superior del modal. Si no se provee, no se renderiza cabecera. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Establece el `maxWidth` aplicable y estilos de adaptación. Si se usa `'full'`, ocupa el `100vw` / `100vh` sin márgenes. |
| `children` | `ReactNode` | **Requerido** | Contenido incrustado dentro del cuerpo (o body) del modal. Tiene su propio scroll en caso de desbordar la altura. |

## Ejemplo de uso

Para utilizar el modal se deben manejar dos estados básicos: una propiedad que determine si está o no abierto (`isOpen`) originado por un evento (ejemplo: hacer clic en un botón) y una función para cerrarlo mediante `onClose`.

```tsx
import React, { useState } from 'react';
import { Button, Typography } from '@mui/material';
import Modal from '@/components/ui/Modal';

const VistaEjemplo = () => {
    const [modalAbierto, setModalAbierto] = useState(false);

    return (
        <div>
            <Button variant="contained" onClick={() => setModalAbierto(true)}>
                Abrir Modal de Confirmación
            </Button>

            <Modal
                isOpen={modalAbierto}
                onClose={() => setModalAbierto(false)}
                title="Confirmar Acción"
                size="sm"
            >
                <Typography variant="body1" sx={{ mb: 2 }}>
                    ¿Estás seguro de que deseas proceder con este cambio en el sistema?
                </Typography>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button onClick={() => setModalAbierto(false)} color="inherit">
                        Cancelar
                    </Button>
                    <Button variant="contained" color="primary" onClick={() => {
                        alert("Acción realizada!");
                        setModalAbierto(false);
                    }}>
                        Proceder
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default VistaEjemplo;
```
