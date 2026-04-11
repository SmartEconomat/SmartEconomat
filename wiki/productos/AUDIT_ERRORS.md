# Auditoría de Productos - Registro de Hallazgos

Este documento registra los problemas detectados en el módulo de Productos durante la auditoría de rendimiento, UX y accesibilidad llevada a cabo en abril de 2026.

## ⚡ Rendimiento y UX (Lighthouse/Performance)
- **Problema**: El modal de formulario (`ProductoFormModal`) se importaba de forma estática, aumentando el bundle inicial de la página innecesariamente.
- **Problema**: La vista de lista (`DataTable`) utilizaba un Spinner central que provocaba un Layout Shift significativo y ocultaba el contexto.
- **Falta de Skeletons**: No existía una transición visual fluida entre la carga de datos y la visualización de las tarjetas de producto.

## ♿ Accesibilidad (WCAG/A11y)
- **Problema**: Los iconos de alérgenos en las tarjetas de producto no tenían `aria-hidden="true"`, provocando redundancia sonora en lectores de pantalla.
- **Problema**: El icono decorativo de filtro en `ProductFilters` era anunciado por los lectores sin aportar valor semántico.
- **Autocomplete**: Aunque el componente de MUI es accesible, faltaba consistencia en la ocultación de iconos decorativos dentro de los Chips de categoría.

## 📱 Responsividad
- **Hallazgo**: El ancho del filtro de categorías en Desktop era estático, lo que desaprovechaba espacio cuando había muchas selecciones (corregido en refactorización previa).
- **Hallazgo**: La visibilidad de los esqueletos en móvil es crítica para la percepción de velocidad en conexiones 4G/5G.
