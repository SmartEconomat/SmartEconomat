# Perfil y Ajustes (Módulo / Página)

Página maestra (`Perfil.tsx`) que ensambla los componentes de formulario para permitir al usuario gestionar sus datos personales y la seguridad de su cuenta.

## Ubicación
`src/pages/Perfil.tsx`

## Composición

1. **Datos Personales (`ProfileForm`)**: Formulario para la visualización y edición del nombre, y visualización estática de propiedades de acceso (usuario, email). Incluye la funcionalidad para solicitar el cambio de correo electrónico de manera administrativa.
2. **Seguridad (`ChangePasswordForm`)**: Componente reactivo para el cambio de contraseña.

## Layout Responsivo UI/UX
Utiliza CSS Grid y utilidades flexbox de MUI para responder de forma fluida a la ventana del cliente:
- **Desktop (`md` en adelante)**: Los formularios de Datos Personales y Cambio de Contraseña se apuestan uno a un lado del otro (`gridTemplateColumns: '1fr 1fr'`).
- **Móvil (`xs`, `sm`)**: Los formularios se apilan verticalmente. Se usa una eliminación dinámica de los márgenes laterales del `MainLayout` y del contenedor de los formularios (`px: { xs: 1 }`) para no asfixiar el espacio de lectura.
