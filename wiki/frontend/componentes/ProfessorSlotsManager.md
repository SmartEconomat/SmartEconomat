# Gestión de Clases (ProfessorSlotsManager)

Componente encargado de la visualización y configuración de clases (grupos) para los perfiles de tipo `PROFESOR`.

## Ubicación
`frontend/smart-economat-frontend/src/features/profile/components/ProfessorSlotsManager.tsx`

## Funcionalidades Principales

### 1. Visualización de Aulas
Muestra una lista de las aulas y clases configuradas por el profesor, incluyendo:
- Nombre del Curso/Grupo.
- Número de Clase.
- Capacidad de alumnos.
- **Código de Clase**: Un identificador único (ej: `SMA-PR-01`) que los alumnos usan para registrarse.

### 2. Copiado Rápido del Código
El código de slot se muestra en una etiqueta (`Badge`) interactiva. Al hacer clic, el código se copia automáticamente al portapapeles del sistema para facilitar su distribución a los alumnos.

### 3. Creación de Nuevas Ubicaciones (Layout Elevado)
Permite añadir nuevas clases mediante un formulario en línea que utiliza un sistema de **Grid Flex** alineado al centro:
- **Alineación Perfecta**: Todos los inputs (`Curso`, `Clase`, `Capacidad`) y el botón `Añadir` comparten el mismo eje vertical (`alignItems="center"`).
- **Responsive**: Transición automática de layout horizontal (Desktop) a vertical (Móvil) para optimizar el espacio.
- **Validaciones**: Bloqueo de campos durante la carga y validaciones nativas de campos numéricos.

## Propiedades (Props)
| Prop | Tipo | Descripción |
| :--- | :--- | :--- |
| `isEditing` | `boolean` | Determina si el formulario de creación es visible. |
| `slots` | `AlumnoSlot[]` | Lista de aulas actuales. |
| `isLoading` | `boolean` | Estado de carga de la lista. |
| `isSaving` | `boolean` | Bloquea acciones mientras se procesa una petición. |
| `newSlot` | `object` | Estado del formulario de nueva aula. |
| `onNewSlotChange` | `function` | Handler para los campos del formulario. |
| `onCreateSlot` | `function` | Ejecuta la creación en el servicio. |
| `onDeleteSlot` | `function` | Ejecuta el borrado de la clase. |

## Interfaz de Datos
```typescript
interface AlumnoSlot {
  id: string;
  aula: string;
  numeroClase: number;
  capacidad: number;
  codigoSlot?: string;
}
```
