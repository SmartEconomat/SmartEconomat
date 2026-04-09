# Arquitectura UI del módulo de recepción

Este documento detalla la estructura y organización de componentes en el Frontend para el flujo de Recepción de Pedidos (`Recepcion.tsx`).

## 1. Problema original
Inicialmente, el archivo `Recepcion.tsx` centralizaba toda la lógica de negocio, manejo de estado (Drafts), y la declaración visual (UI) de los 4 pasos del "Wizard" de recepción, además de todos los modales adyacentes. Esto provocó que el archivo superara las 1,400 líneas de código, dificultando su legibilidad, mantenimiento y escalabilidad.

## 2. Nueva arquitectura basada en componentes
Para adherirse al principio de *Single Responsibility* (Responsabilidad Única) y mejorar la separación de conceptos, el monolito visual fue dividido en múltiples submódulos puramente presentacionales y de flujo, ubicados en `src/components/recepcion/`.

### 2.1 Archivo principal: `Recepcion.tsx`
Ubicación: `src/pages/Recepcion.tsx`
- **Responsabilidad**: Actuar como el *Smart Component* (Componente Inteligente) o controlador general.
- **Funcionalidad**: 
  - Mantiene el estado global del proceso (`RecepcionDraft`), sincronizado con el servidor para persistencia.
  - **Estado de Carga Inicial**: Implementa un bloqueo visual (`isReady`) mientras recupera el borrador remoto para evitar pérdida de datos al refrescar.
  - Orquesta qué paso del Wizard mostrar (`activeStep`).
  - **Gestión de Báscula**: Controla el estado y visibilidad del chip de la báscula, limitándolo al paso de escaneo.
  - Provee las funciones de *callbacks* (ej. `handleUpdateLinea`, `handleSearch`) a sus componentes hijos.

### 2.2 Componentes de Flujo (Wizard Steps)
Ubicación: `src/components/recepcion/`

1. **`PasoSeleccionPedidos.tsx` (Paso 1)**
   - Lista pedidos pendientes y permite su selección.

2. **`PasoEscaneo.tsx` (Paso 2)**
   - Interfaz de lectura de códigos de barras y control de báscula.
   - Pinta las tablas interactivas con feedback de color inmediato.

3. **`PasoRevision.tsx` (Paso 3)**
   - Resumen total de mercancía agrupada por proveedor.
   - Evalúa discrepancias y exige notas si existen diferencias.

4. **`PasoResultado.tsx` (Paso 4)**
   - Hoja de impacto tras el guardado exitoso.
   - **Reporte PDF**: Permite descargar un comprobante formal de la recepción mediante el botón **"Descargar Detalles (PDF)"**.
   - Muestra tarjetas de estadísticas (StatCards) sobre productos en almacén e incidencias.

### 2.3 Componentes Auxiliares
Ubicación: `src/components/recepcion/`

- **`WeightScaleModal.tsx`**: Comunicación con el hardware de la báscula.
- **`NewProductModal.tsx`**: Creación de productos no existentes en la base de datos.
- **`DetailModal.tsx`**: Detalle extendido de los resultados de la recepción.

## 3. Beneficios Obtenidos
1. **Reducción de Deuda Técnica**: Mejor separación de lógica y presentación.
2. **Persistencia Confiable**: El usuario puede refrescar o salir de la página sin perder el progreso.
3. **Interfaz Limpia**: La información de la báscula solo aparece cuando es necesaria.

