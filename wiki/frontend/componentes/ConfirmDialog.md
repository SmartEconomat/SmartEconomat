# Componente de Confirmación (ConfirmDialog)

El componente \`ConfirmDialog\` es un modal especializado destinado a interceptar acciones potencialmente destructivas o críticas por parte del usuario y exigirle una última decisión explícita. Actúa como wrapper sobre el \`Modal\` genérico subyacente.

## Propósito
- Asegurar que la acción del usuario no fue accidental (P.Ej.: Borrar un registro).
- Estandarizar la presentación de las alertas destructivas a lo largo de la aplicación mediante Material UI.
- Minimizar el boilerplate derivado de configurar de forma independiente el HTML semántico para preguntas de confirmación clásica (Hacer un Modal con su contenedor de footer y sus 2 botones correspondientes).

## Interfaz de Props (ConfirmDialogProps)

| Propiedad | Tipo | Por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| \`isOpen\` | \`boolean\` | Requerido | Condición booleana que dicta si la ventana es visible. |
| \`onClose\` | \`function()\` | Requerido | Callback emitido al cancelar o cliquear el overlay para descartar. |
| \`onConfirm\` | \`function()\` | Requerido | La función de alto impacto (ej: llamar al API para borrar). |
| \`title\` | \`string\` | \`"Confirmar acción"\` | Cabecera del cuadro de diálogo. |
| \`message\` | \`ReactNode\` | Requerido | El texto central preguntándole al usuario si está seguro, pero puede admitir sintaxis HTML. |
| \`confirmText\` | \`string\` | \`"Confirmar"\` | Rótulo sobre el botón afirmativo. |
| \`cancelText\` | \`string\` | \`"Cancelar"\` | Rótulo sobre el botón de descarto. |
| \`confirmColor\` | \`ButtonColor\` | \`"error"\` | Clase de Material UI que inyectará el color al botón afirmativo (danger, primary, etc.). | 
| \`confirmVariant\` | \`Variant\` | \`"contained"\` | Fuerza visual del botón primario (Por defecto sombreado fuerte del color base). | 

## Ejemplo de Integración

Este es un ejemplo de cómo invocar un Dialogo de Eliminación desde cualquier componente React en donde el flujo destructivo es interceptado.

\`\`\`tsx
import React, { useState } from 'react';
import { Button } from '@mui/material';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export const DeleteUserButton = () => {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleDelete = () => {
        // ... llamada API de borrado
        console.log('Se destruye para siempre...');
        setIsConfirmOpen(false); // No olvidar cerrarlo
    }

    return (
        <>
            <Button color="error" onClick={() => setIsConfirmOpen(true)}>
                Eliminar usuario
            </Button>
            
            <ConfirmDialog 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Borrar Usuario"
                message="¿Estás seguro/a de que deseas borrar este registro de manera permanente? Esta acción no se puede deshacer."
                confirmText="Sí, Borrar Permanentemente"
                cancelText="Mantenlo a salvo"
            />
        </>
    )
}
\`\`\`
