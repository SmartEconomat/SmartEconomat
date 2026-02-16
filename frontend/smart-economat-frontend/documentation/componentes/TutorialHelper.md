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
-   La **Inyección de Datos** desde `tutorialConfig`, seleccionando el contenido según la URL actual.

## Props
-   `mode`: `'icon' | 'listitem'` (Opcional, default: `'icon'`).
-   `isOpen`: `boolean` (Opcional).

## Accesibilidad
-   Incluye un `Tooltip` descriptivo ("Ver guía de ayuda") que facilita la comprensión del botón para usuarios de lectores de pantalla y navegación por teclado.


---

## Estructura de Datos
El contenido no está "hardcodeado" en el componente, sino que se inyecta desde una configuración externa para facilitar el mantenimiento por parte del equipo de UX/Redacción.

**Archivo:** `src/utils/config/tutorialConfig.tsx`

```typescript
// Ejemplo de estructura
'/ruta-pagina': {
    steps: [
        {
            icon: <Icono />, 
            title: "Título del Paso", 
            description: "Explicación breve..." 
        }
    ]
}
```

## Funcionalidad UX
1.  **Contextualidad:** El usuario no necesita buscar ayuda; la ayuda relevante "vive" en la página actual.
2.  **No Intrusivo:** Es un tutorial bajo demanda (clic en `?`), no un modal bloqueante que salta automáticamente.
3.  **Progresividad:** La información se dosifica paso a paso (Carousel) para no abrumar (Cognitive Load management).
