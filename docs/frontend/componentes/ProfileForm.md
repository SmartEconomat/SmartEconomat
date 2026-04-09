# Documentación de Componente: ProfileForm

**Tipo:** Componente de formulario (Feature)  
**Ubicación:** `src/features/profile/components/ProfileForm.tsx`  

---

## Descripción General

`ProfileForm` permite al usuario interactuar de forma segura con los registros base de su entidad (nombre e email). Como el cambio de correo es sensible en SmartEconomat, no se actualiza por endpoint directo sino delegando al administrador del sistema.

---

## Estructura de Campos

- **Nombre de Usuario (Username)**: Editable por el usuario.
- **ID de Usuario**: Campo de solo lectura que muestra el identificador único del sistema.
- **Email**: Campo informativo con acción de solicitud de cambio.

## Funcionalidades Dinámicas

### Modal de Solicitud de Cambio de Correo
Si un usuario busca cambiar su dirección de email principal, debe interactuar con el botón `Contactar` el cual apila un Diálogo Modal:
- Solicita el **Nuevo Correo**.
- Solicita la **Confirmación**.
- Demanda adjuntar un **Motivo**.

### Validaciones de Solicitud de Email
El proceso de solicitud en el componente principal (`Perfil.tsx`) implementa validaciones robustas:
- **Formato**: Verificación mediante Regex del formato de correo electrónico.
- **Unicidad**: El sistema impide que el nuevo correo sea igual al actual.
- **Justificación**: Requiere obligatoriamente un motivo de al menos 10 caracteres para procesar la petición.

### Consistencia Vertical
Este panel al ser par del módulo de nueva contraseña fue rediseñado usando flexbox vertical y espacios (`gap` de sub-cajas `0.25`) para mantener botones en simetría independientemente del estatus y los mensajes dinámicos que arrojen los helpers.

---

## API Consumida

| Método  | Endpoint                 | Acceso |
|---------|--------------------------|--------|
| `GET`   | `/v1/usuarios/perfil`    | Lectura de datos base perfil (inicialización estado local). |
| `PATCH` | `/v1/usuarios/perfil`    | Manipulación explícita de campos permitidos (nombre). |
