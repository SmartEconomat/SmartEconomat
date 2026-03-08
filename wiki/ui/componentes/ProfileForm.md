# Documentación de Componente: ProfileForm

**Tipo:** Componente de formulario (Feature)  
**Ubicación:** `src/features/profile/components/ProfileForm.tsx`  

---

## Descripción General

`ProfileForm` permite al usuario interactuar de forma segura con los registros base de su entidad (nombre e email). Como el cambio de correo es sensible en SmartEconomat, no se actualiza por endpoint directo sino delegando al administrador del sistema.

---

## Funcionalidades Dinámicas

### Modal de Solicitud de Cambio de Correo
Si un usuario busca cambiar su dirección de email principal, debe interactuar con el botón `Contactar` el cual apila un Diálogo Modal:
- Solicita el **Nuevo Correo**.
- Solicita la **Confirmación**.
- Demanda adjuntar un **Motivo**.

### Validaciones en Tiempo Real (Email)
El sistema ejecuta un hook en Background (`useEffect`) a cada pulsación del estado (`onChange`) que revisa la integridad cruzada entre el nuevo email y la comprobación de tipeo de seguridad. Modificando iterativamente si *"Los correos coinciden"* con estilos nativos del Theme para Success y Error state pre-envío.

### Consistencia Vertical
Este panel al ser par del módulo de nueva contraseña fue rediseñado usando flexbox vertical y espacios (`gap` de sub-cajas `0.25`) para mantener botones en simetría independientemente del estatus y los mensajes dinámicos que arrojen los helpers.

---

## API Consumida

| Método  | Endpoint                 | Acceso |
|---------|--------------------------|--------|
| `GET`   | `/v1/usuarios/perfil`    | Lectura de datos base perfil (inicialización estado local). |
| `PATCH` | `/v1/usuarios/perfil`    | Manipulación explícita de campos permitidos (nombre). |
