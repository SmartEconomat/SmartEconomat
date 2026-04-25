# Componentes de Distribución

Biblioteca de componentes para la gestión de la entrega final de pedidos a los usuarios, integrando la lógica de "Bolsas" (Distribución de pedidos consolidados).

---

## DistribucionTabs

Control de estado para gestionar el flujo de entregas pendientes frente al registro histórico.

- **Ubicación**: `src/pages/Distribucion.tsx`
- **Vistas**:
    - **Disponibles**: Muestra los pedidos que ya han sido recibidos en el economato y están listos para ser entregados al usuario final (Alumno/Profesor).
    - **Historial**: Registro de todas las distribuciones completadas o canceladas para auditoría.
- **Micro-interacción**: El cambio de pestaña dispara automáticamente una recarga de datos con un efecto de carga (`isLoading`) suave, asegurando que la información de stock disponible sea siempre precisa.

## DistribucionDraftDialog (Gestor de Entrega)

El núcleo operativo de la distribución, encargado de registrar qué se entrega físicamente.

- **Ubicación**: `src/pages/Distribucion.tsx` (Componente de Flujo)
- **Funcionalidad**:
    - **Control de Cantidades**: Permite ajustar la cantidad entregada en caso de que el usuario no recoja todo el pedido de una vez (Entregas Parciales).
    - **Validación de Límites**: Bloquea entregas superiores a la cantidad disponible en el lote.
    - **Selección de Ubicación**: Identifica automáticamente la zona de procedencia del stock para realizar el movimiento de inventario correcto.
- **Feedback Visual**: Las líneas completadas se marcan con un icono de `CheckCircleOutline`, mientras que las pendientes mantienen el foco para el operario.

## ResumenDistribucionTable

Visor de contenido para auditoría de bolsas de entrega.

- **Ubicación**: `src/pages/Distribucion.tsx` (Utilizado en Modales de Detalle)
- **Propósito**: Desglose técnico de una distribución realizada, mostrando:
    1. **Producto**: Identidad del artículo entregado.
    2. **Cantidad**: Volumen total de la bolsa.
    3. **Ubicación Origen**: De qué parte del economato se extrajo la mercancía.
- **Diseño**: Basado en `TableContainer` de MUI con un estilo simplificado para facilitar la lectura rápida en dispositivos móviles durante la entrega física.

## PerfilDistribucion (Lógica de Auto-Ubicación)

Componente lógico invisible pero crítico para la UX de distribución.

- **Comportamiento**: Sistema inteligente que detecta el perfil del usuario (Alumno/Profesor) y pre-selecciona automáticamente su ubicación de entrega habitual (Aula/Slot), reduciendo la fricción y los errores de datos durante el proceso de salida de mercancía.
