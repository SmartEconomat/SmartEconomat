# Documentación de Componente: Login

**Tipo:** Página/Feature (Page/Feature)  
**Ubicación:** `src/features/auth/Login.tsx`

## Descripción General
El componente **Login** es la puerta de entrada a la aplicación. Gestiona la autenticación del usuario mediante credenciales (usuario/contraseña) y proporciona feedback visual sobre el estado del proceso (carga, éxito, error).

---

## Desglose Atómico (Construcción)

### 1. Átomos (Atoms)
-   **Input (`Input.tsx`):** Campos de texto estilizados para usuario y contraseña.
-   **Botón (`Button.tsx`):** Elemento de acción para enviar el formulario.
-   **Checkbox:** Opción para "Recordarme".
-   **Tipografía:** Títulos y enlaces de recuperación de contraseña.
-   **Logo:** Identidad visual de la marca.

### 2. Moléculas (Molecules)
-   **Form Group:** Agrupación visual de etiqueta + input.
-   **Footer de Acción:** Botón de envío + Enlaces de ayuda.

### 3. Organismo (Organism)
-   **LoginForm:** El contenedor que gestiona el estado local del formulario (`formData`), la validación y la llamada al `AuthContext`.

### 4. Plantilla/Página (Template/Page)
-   **Login Page:** Centra el formulario en la pantalla, aplica el fondo y gestiona la redirección post-login usando `useNavigate`.

---

## Funcionalidad UX
1.  **Feedback de Estado:** El botón cambia a estado "Cargando" (`disabled` + spinner) durante la petición.
2.  **Validación:** Los campos vacíos resaltan visualmente.
3.  **Accesibilidad:** Soporte para navegación por teclado (Tab) y envío con Enter.
4.  **Gestión de Errores:** Mensajes claros (`alert` o `snackbar`, según implementación actual) si las credenciales son incorrectas.

## Integración
Utiliza el `AuthContext` (`src/store/AuthContext.tsx`) para la lógica de negocio real (verificación de credenciales y almacenamiento de token).
