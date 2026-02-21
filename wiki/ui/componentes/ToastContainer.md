# ToastContainer 

Componente global para renderizar notificaciones emergentes (*toasts*) apilables estilo Snackbar. Está integrado con la API `Context` y funciona en conjunto con `ToastProvider` y el hook `useToast` para permitir que cualquier componente envíe notificaciones.

## Ubicación
-   **Contenedor UI:** `src/components/common/Notification/ToastContainer.tsx`
-   **Contexto y Hooks:** `src/store/ToastContext.tsx`

## Arquitectura y Dependencias

Este sistema de notificaciones está separado en dos partes:
1.  **Estado Global (`ToastProvider`)**: Maneja la lista reactiva de notificaciones activas y expone métodos para añadir o remover los toasts mediante los hooks `useToast` y `useToastList`.
2.  **Capa Presentacional (`ToastContainer`)**: Se encarga de suscribirse a la lista de notificaciones e iterar sobre ella, renderizando un `<Snackbar>` con un `<Alert>` de MUI por cada alerta activa.

## Integración (Setup)

Para usar el sistema, asegúrate de que toda la aplicación (o el árbol de componentes donde se necesite) esté envuelta en el `ToastProvider`. **El `ToastContainer` debe ser incluido dentro del `ToastProvider` a un nivel superior, como en `App.tsx` o un Layout global.**

```tsx
import { ToastProvider } from '@/store/ToastContext';
import ToastContainer from '@/components/common/Notification/ToastContainer';

const App = () => {
    return (
        <ToastProvider>
            {/* El contenedor renderizará los toasts en la capa flotante de la app */}
            <ToastContainer />
            
            <RestoDeTuAplicacion />
        </ToastProvider>
    );
};
```

## Uso (Lanzar Notificaciones)

Para crear una notificación desde cualquier componente hijo, utiliza el hook `useToast()`.

### Hook \`useToast\`

Este hook devuelve un objeto con 4 funciones preparadas correspondientes a los 4 niveles de severidad (`success`, `error`, `info`, `warning`).

*   **Firma de llamada**: `tipo(mensaje: string, duracion?: number)`
*   **Parámetros**:
    *   **mensaje**: El texto que se mostrará en la alerta.
    *   **duracion**: El tiempo en milisegundos tras el cual el toast se cerrará automáticamente (por defecto son `3000` ms). Puedes pasar `Infinity` si no deseas que se cierre solo.

### Ejemplos

```tsx
import React from 'react';
import { useToast } from '@/store/ToastContext';

const MiComponente = () => {
    // Importamos las funciones necesarias del hook
    const { success, error, warning, info } = useToast();

    const handleGuardar = async () => {
        try {
            await guardarDatos();
            // Notificación de éxito (se oculta tras 3 segundos por defecto)
            success('Datos guardados correctamente.');
        } catch (err) {
            // Notificación de error (se puede customizar la duración)
            error('Hubo un problema al guardar.', 5000);
        }
    };

    return (
        <button onClick={handleGuardar}>Guardar</button>
    );
};
```

## Componentes Internos
### `ToastContainer.tsx`
No recibe props, simplemente lee del contexto. Maneja la UI de Material UI (`Snackbar`, `Alert`, y `Stack` para apilar). Se ancla a la esquina inferior derecha (`bottom: 24`, `right: 24`) con un `zIndex` altísimo (`9999`) para asegurar que aparezca por encima de modales o fondos *overlay*.

### `ToastContext.tsx`
Proporciona los tipos typescript `ToastType` y `Toast`. Expone el contexto interno para mantener la base de datos de los todos los mensajes mostrados en un identificador dinámico de tiempo limitado.
