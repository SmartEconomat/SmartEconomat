# Auditoría UX/UI: Mi Perfil y Preferencias

Este documento registra los hallazgos de usabilidad y errores detectados en el área personal y de configuración de cuenta de SmartEconomat.

## 🔴 Errores y Puntos de Fricción Identificados

### 1. Autogestión y Roles
- **Confusión en Permisos**: Los usuarios de roles limitados (Alumnos) intentaban cambiar campos como su Email o CIAL, sin recibir una explicación clara de que esas ediciones están restringidas por motivos de seguridad académica.
- **Visibilidad de Sesión**: La información sobre el último acceso y los dispositivos conectados no estaba presente en la vista, lo que impedía al usuario verificar la seguridad de su cuenta de forma autónoma.
- **Preferencias de Interfaz**: El selector de "Modo Tips" no tenía un lugar destacado en el perfil, lo que dificultaba que los usuarios que ya conocían el sistema pudieran desactivar la ayuda contextual de forma global.

### 2. Accesibilidad (a11y)
- **Carga de Avatares**: El componente para subir o cambiar la foto de perfil no era operable totalmente mediante navegación por teclado.
- **Confirmación de Cambios**: Al guardar cambios en la información personal, el Toast/Snackbar de éxito no siempre recibía el foco, lo que impedía que los lectores de pantalla leyeran la confirmación inmediatamente.

### 3. Responsividad
- **Tarjetas de Perfil**: En dispositivos móviles, el diseño de la tarjeta de usuario se amontonaba, cortando el nombre completo del usuario si este era muy largo.
- **Seguridad en Móvil**: El formulario de cambio de contraseña presentaba un centrado inadecuado de los botones de "Confirmar" en pantallas de menos de 480px.
