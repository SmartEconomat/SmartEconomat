# Auditoría UX/UI: Gestión de Recepciones

Este documento registra los hallazgos de usabilidad y errores detectados en el módulo de recepción de mercancía y pesaje de SmartEconomat.

## 🔴 Errores y Puntos de Fricción Identificados

### 1. Flujo Operativo y Sincronización
- **Pérdida de Progreso en Almacén**: Los usuarios reportaban que al recepcionar pedidos grandes con tablets en zonas de baja cobertura (cámaras frigoríficas), temían perder los datos del pesaje si la aplicación se desconectaba.
- **Complejidad del Pesaje**: La integración con la báscula USB no era evidente para usuarios novatos, quienes no sabían cómo confirmar si la conexión estaba activa antes de pesar.
- **Navegación entre Pasos**: El flujo de 4 pasos (Pedidos -> Productos -> Pesaje -> Revisión) resultaba fragmentado si el usuario necesitaba volver atrás para corregir una cantidad ya pesada.

### 2. Accesibilidad (a11y)
- **Feedback de Pesada**: El valor capturado desde la báscula no siempre se notificaba de forma audible a los lectores de pantalla, dificultando la operación para personal con discapacidad visual.
- **Controles del Stepper**: Los indicadores de paso del Stepper carecían de etiquetas descriptivas que indicaran el progreso relativo.

### 3. Responsividad
- **Visor de Báscula**: En pantallas pequeñas, el widget de peso en tiempo real (Big Number) tapaba la descripción del producto que se estaba recibiendo.
- **Inputs de Cantidad**: El teclado numérico de los dispositivos móviles a veces cubría el botón de "Siguiente Paso" en la vista de conteo.
