# Perfil y Ajustes (Módulo / Página)

Página maestra (`Perfil.tsx`) refactorizada como una **Ficha de Usuario Unificada**. Centraliza toda la información personal, seguridad y herramientas de gestión en una sola vista coherente y editable.

## Ubicación
`src/pages/Perfil.tsx`

## Arquitectura Modular (Múltiples Tarjetas)

La página se divide en bloques independientes para una mejor gestión de la información:

### 1. Perfil y Seguridad (Tarjeta de Usuario)
Contenedor dedicado a la información personal y credenciales:
- **Datos Personales**: Nombre, Email y Alias.
- **Seguridad**: Cambio de contraseña protegida.
- **Acción**: Botón "Editar Perfil" exclusivo para esta sección.

### 2. Gestión Académica (Tarjeta de Gestión - Solo Profesores)
Contenedor modular para la administración del personal docente:
- **Gestión de Clases**: Alta y baja de cursos/clases con sus códigos y cupos.
- **Listado de Alumnos**: Visualización jerárquica y acciones sobre alumnos.
- **Acción**: Botón "Gestionar Clases" para habilitar las herramientas de administración sin afectar los datos personales.

## Layout Responsivo UI/UX y Simetría

La página es 100% responsiva utilizando el sistema de breakpoints de MUI:
- **Diseño Simétrico**: Los botones principales ("Editar Perfil" y "Gestionar Clases") están alineados en la esquina **inferior derecha** de sus respectivas tarjetas. Comparten el mismo tamaño y estilo para dar una sensación de equilibrio visual.
- **Acciones Independientes**: Cada bloque gestiona su propio estado de edición (`isEditingProfile` y `isEditingSlots`), permitiendo al usuario modificar una sección sin activar el modo de edición en la otra.
- **Feedback Visual**: Los códigos de clase se muestran como Badges interactivos ("Códigos de Clase") que facilitan el copiado rápido al portapapeles.

## Sistema de Ayuda Contextual

La página invoca al componente `TutorialHelper` de forma simplificada (`<TutorialHelper />`). La lógica de los pasos y el contenido se gestiona de forma centralizada en la configuración global, filtrando automáticamente por el rol del usuario:
- **Vista Alumno**: Enfocado en datos personales, seguridad y el proceso de cambio de email con aprobación.
- **Vista Profesor**: Incluye adicionalmente la gestión de aulas, slots y administración de alumnos.

---

_Esta documentación refleja la arquitectura modular implementada para separar la gestión personal de la académica._
