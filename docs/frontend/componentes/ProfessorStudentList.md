# Listado de Alumnos (ProfessorStudentList)

Componente de gestión de alumnos agrupados por clase/grupo para el perfil del `PROFESOR`. Utiliza un diseño de acordeones para organizar la información de forma jerárquica.

## Ubicación
`frontend/smart-economat-frontend/src/features/profile/components/ProfessorStudentList.tsx`

## Arquitectura de Visualización

### 1. Acordeones por Clase (MUI Accordion)
Los alumnos no se muestran en una lista plana, sino agrupados bajo el aula y número de clase correspondientes.
- **Cabecera**: Muestra el nombre del curso, clase, código de clase y el ratio de alumnos registrados vs capacidad.
- **Contenido**: Lista detallada de alumnos vinculados a ese grupo específico.

### 2. Acciones de Gestión de Alumnos
Cada alumno en la lista dispone de las siguientes capacidades:
- **Activación**: Interruptor (`Switch`) para validar el registro del alumno (Cambia de `INACTIVE` a `ACTIVE`).
- **Reseteo de Password**: Genera una contraseña provisional de 8 caracteres y obliga al alumno a cambiarla en su próximo acceso.
- **Gestión de Permisos**: (En desarrollo) Punto de acceso para asignar roles específicos al alumno.
- **Desvinculación**: Permite eliminar/desvincular al alumno del profesor.

### 3. Sistema de Fallback
Si el componente no detecta clases configuradas (o el backend no proporciona la lista de aulas), el sistema agrupa automáticamente a todos los alumnos bajo una sección genérica llamada "**Alumnos Registrados**" para mantener la funcionalidad operativa.

## Propiedades (Props)
| Prop | Tipo | Descripción |
| :--- | :--- | :--- |
| `students` | `Alumno[]` | Lista global de alumnos devueltos por el servicio. |
| `slots` | `AlumnoSlot[]` | Lista de aulas para el agrupamiento. |
| `isLoading` | `boolean` | Estado de carga. |
| `onToggleStatus` | `function` | Llama al servicio de activación. |
| `onResetPassword` | `function` | Llama al servicio de fuerza de password. |
| `onManagePermissions`| `function` | Abre el flujo de gestión de permisos. |
| `onDeleteStudent` | `function` | Llama al servicio de desvinculación. |
| `isSaving` | `boolean` | Bloquea la UI durante la persistencia. |

## Interfaz de Datos (Alumno)
```typescript
interface Alumno {
  id: string;
  username: string;
  status: 'ACTIVE' | 'INACTIVE';
  aula: string;
  numeroClase: number;
}
```
