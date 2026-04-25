# Documentación de Componente: Tutorial de Página

**Tipo:** Molécula / Disparador  
**Ubicación:** `src/components/common/Tutorial/TutorialHelper.tsx`

## Descripción General
El componente **Tutorial de Página** (anteriormente "Ayuda") es el punto de entrada para que el usuario inicie un recorrido interactivo por el módulo actual. Su objetivo es proporcionar asistencia dinámica mediante el sistema de tours integrados.

---

## Desglose Atómico

### Átomos utilizados:
-   **Icono de Ayuda (`HelpOutlineIcon`):** Identificador visual estándar para soporte.
-   **Tipografía (`Typography`):** Label "Tutorial" en el menú lateral.
-   **Tooltips Dinámicos:** Proporcionan micro-explicaciones según el estado del sidebar y el "Modo Tips".

### Integración en el Sistema:
Este componente actúa como un **disparador**. No contiene la lógica del tour ni el renderizado de los diálogos, sino que se comunica con el motor central `InteractiveTour` mediante el hook `useTutorial`.

---

## Comportamiento e Interacción

1. **Modo Icono (`mode="icon"`)**:
   - Se utiliza generalmente en la barra de herramientas superior o en vistas compactas.
   - Al hacer clic, invoca `startTour(location.pathname)`.

2. **Modo Lista (`mode="listitem"`)**:
   - Integrado en el Sidebar principal.
   - Muestra el texto "Tutorial" junto al icono si el sidebar está expandido.
   - Incluye estados visuales de hover alineados con el sistema de diseño de SmartEconomat.

3. **Accesibilidad y UX Writing**:
   - **Label actual:** "Tutorial" (ajustado para ser más descriptivo de la acción secuencial).
   - **Aria-label:** "Iniciar tutorial" para lectores de pantalla.
   - **Tooltip Contextual:** Muestra *"Iniciar tutorial interactivo por este módulo"* para guiar al usuario.

---

## Mantenimiento y Configuración
El componente delega la búsqueda de pasos al motor central. Para que una página tenga un tutorial funcional al pulsar este botón, debe existir una entrada correspondiente en:
**Archivo:** `src/utils/config/tutorialData.tsx`

```typescript
// Ejemplo de configuración en tutorialData
'/productos': {
    steps: [
        { target: '#btn-nuevo', title: '...', description: '...' },
        // ...
    ]
}
```

---

## Documentos Relacionados
- [InteractiveTour.md](file:///Users/alexisruiz/SmartEconomat/docs/frontend/componentes/InteractiveTour.md) (Motor del sistema)
- [LearningModeToggle.md](file:///Users/alexisruiz/SmartEconomat/docs/frontend/componentes/LearningModeToggle.md) (Interruptor de Tips)
