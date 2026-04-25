# Página: Recepción de Mercancía

**Ruta:** `/recepciones`
**Ubicación:** `src/pages/Recepcion.tsx`

## Propósito
La página de Recepciones gestiona la entrada física de productos al economato. Es un módulo crítico que asegura que lo solicitado a los proveedores coincida con lo recibido, integrando procesos de pesaje técnico y detección de incidencias en tiempo real.

## Componentes Utilizados
- **RecepcionStepper**: Orquestador del flujo de 4 pasos (Selección, Conteo, Revisión, Cierre).
- **RecepcionProductoEntry**: Fila de entrada de datos con soporte para báscula USB y escáner.
- **CloudSyncStatus**: Indicador visual de la persistencia del borrador en la nube.
- **[InteractiveTour](../componentes/InteractiveTour.md)**: Guía interactiva por el asistente de recepción.

## Asistencia en Recepción ✅

El módulo cuenta con un sistema de ayuda para garantizar la precisión de los datos:

### Tour de Recepción (5 pasos)
1. **Asistente de Recepción**: Introducción al flujo guiado de pasos.
2. **Borrador Seguro**: Explicación de la sincronización automática (CloudSync).
3. **Recepción Inteligente**: Uso del escáner y búsqueda de productos.
4. **Conexión con Báscula**: Captura de pesos automática vía USB.
5. **Navegación**: Gestión del movimiento entre etapas del proceso.

## Funcionalidades Clave
- **Sincronización en la Nube**: Permite iniciar una recepción en un dispositivo y terminarla en otro sin pérdida de información.
- **Detección de Incidencias**: Generación automática de registros de discrepancia cuando las cantidades recibidas no coinciden con el pedido.
- **Escalabilidad de Pesaje**: Soporte para configuraciones de báscula industriales mediante conexión directa al navegador.

## Servicios Consumidos
| Método | Endpoint | Uso |
| :--- | :--- | :--- |
| GET | `/pedidos/pendientes` | Carga de órdenes de compra listas para recibir. |
| POST | `/recepciones` | Envío del parte de recepción finalizado. |
| PATCH | `/recepciones/draft` | Persistencia del borrador intermedio. |
