# Arquitectura de Frontend - SmartEconomat

## Visión General
Este documento detalla la arquitectura técnica del frontend de SmartEconomat. El proyecto está construido con React y TypeScript, siguiendo una estructura modular basada en características (features) y capas de responsabilidad.

## Principios de Diseño
1.  **Atomic Design (Adaptado):** Los componentes se construyen desde lo más pequeño (átomos) hasta vistas completas (páginas).
2.  **Separación de Intereses:**
    -   **UI (Componentes):** Solo se encargan de renderizar.
    -   **Lógica (Hooks):** Encapsulan el comportamiento y estado.
    -   **Datos (Store/Services):** Manejan la comunicación y persistencia.
3.  **Co-locación:** Los archivos relacionados (estilos, tests, subcomponentes exclusivos) permanecen juntos.

## Estructura de Directorios

```text
src/
├── assets/            # Recursos estáticos (SVG, PNG, Fonts).
├── components/        # Componentes reutilizables.
│   ├── ui/            # Átomos y Moléculas (Botones, Inputs, Cards).
│   └── common/        # Organismos compartidos (Tutorial, Modales).
├── features/          # Módulos de negocio (Auth, Inventario).
│   └── [feature]/     # Cada feature contiene sus componentes, hooks y api.
├── hooks/             # Hooks globales.
├── layouts/           # Plantillas de página (MainLayout).
├── pages/             # Vistas principales (rutas).
├── routes/            # Configuración de navegación.
├── store/             # Estado global (Context/Redux: Auth, Theme).
├── utils/             # Funciones auxiliares.
│   └── config/        # Configuraciones globales (Menú, Tutorial).
└── documentation/     # Documentación del proyecto.
```

## Flujo de Desarrollo de Componentes
Para mantener la consistencia UX/UI, todo nuevo componente debe seguir este flujo:

1.  **Identificación:** ¿Es un átomo (botón), molécula (campo de búsqueda) u organismo (tabla compleja)?
2.  **Ubicación:** 
    -   Si es genérico -> `src/components/ui`
    -   Si es específico de una función -> `src/features/[feature]`
3.  **Implementación:** Crear archivo `.tsx` y definir sus `Props` explícitamente.
4.  **Estilado:** Usar `MUI` (Material UI) con el tema personalizado en `src/utils/theme`.
