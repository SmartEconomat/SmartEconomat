# Documentación de Componente: Tutorial Onboarding

**Tipo:** Organismo (Organism)  
**Ubicación:** `src/components/common/Tutorial/TutorialHelper.tsx`

## Descripción General
El componente **Tutorial Onboarding** es una guía interactiva contextual tipo carrusel (wizard). Su objetivo es orientar al usuario sobre las funcionalidades clave de la página en la que se encuentra actualmente.

---

## Desglose Atómico (Construcción)

Para construir este componente, hemos compuesto los siguientes elementos, desde lo más atómico hasta el organismo completo:

### 1. Átomos (Atoms)
Elementos indivisibles de la interfaz utilizados:
-   **Icono de Ayuda (`HelpOutlineIcon`):** El disparador visual para iniciar el tutorial.
-   **Iconos de Pasos (`DashboardIcon`, etc.):** Representación visual de cada funcionalidad explicada.
-   **Tipografía (`Typography`):** Títulos (`h6`) y descripciones (`body2`).
-   **Botones de Navegación (`IconButton`, `Button`):** Flechas (`<`, `>`) para moverse entre los pasos.
-   **Dots (Puntos):** Indicadores visuales de progreso en el carrusel.

### 2. Moléculas (Molecules)
Combinaciones de átomos funcionales:
-   **Tarjeta de Paso (Card Content):** Contenedor que agrupa el Icono Grande + Título + Descripción.
-   **Control de Pasos (MobileStepper):** Componente de MUI que combina los "Dots" con los botones "Anterior" y "Siguiente".

### 3. Organismo (Organism) -> `TutorialHelper`
El componente completo que integra:
-   Un **Botón Disparador** (El icono `?` en el header).
-   Un **Popover** (Contenedor flotante) que aloja el contenido.
-   La **Lógica de Estado** (`activeStep`) para manejar la navegación del carrusel.
-   **Inyección de Datos** desde `tutorialConfig`, seleccionando el contenido según el **Rol del Usuario** (`PROFESOR`/`ALUMNO`) y la ruta actual, delegando la lógica de selección al componente.

## Props
-   `mode`: `'icon' | 'listitem'` (Opcional, default: `'icon'`).
-   `isOpen`: `boolean` (Opcional).

## Accesibilidad y UX
-   **Tooltip Inteligente:**
    -   Muestra "Ver guía de ayuda" solo cuando el sidebar está colapsado (`isOpen=false`).
    -   Se oculta cuando el sidebar está expandido para evitar redundancia con el texto del botón.
    -   Se adapta al "Modo Aprendizaje" ofreciendo descripciones más largas si está activo.


---

## Estructura de Datos
El contenido no está "hardcodeado" en el componente, sino que se inyecta desde una configuración externa para facilitar el mantenimiento por parte del equipo de UX/Redacción.

**Archivo:** `src/utils/config/tutorialConfig.tsx`

```typescript
// Estructura con soporte para roles
'/ruta-pagina': {
    roles: {
        'PROFESOR': [
            { icon: <Icono />, title: "...", description: "..." }
        ],
        'ALUMNO': [
            { icon: <Icono />, title: "...", description: "..." }
        ]
    },
    // Fallback si no hay roles definidos o para otros roles
    steps: [ ... ] 
}
```

## Configuraciones Específicas de Página

### Página de Perfil (`/perfil`)
Se ha configurado un tour de 4 pasos para guiar al usuario a través de la nueva arquitectura modular:
1. **Perfil de Usuario**: Explicación de datos básicos y edición.
2. **Seguridad**: Importancia del cambio de contraseña.
3. **Gestión Académica**: Configuración de clases y generación de códigos (Solo Profesores).
4. **Control de Alumnos**: Gestión de activación y passwords de estudiantes (Solo Profesores).

---

## Mantenimiento
Para añadir nuevos tutoriales, simplemente añada una nueva entrada en `src/utils/config/tutorialConfig.tsx`. El componente `TutorialHelper` utiliza el hook `useAuth` para identificar el rol y filtrar los pasos automáticamente. Si se requieren pasos muy específicos para un caso de uso único, el componente aún acepta la prop `steps` como override prioritario.
