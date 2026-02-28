# Servicio de Usuarios (usuarioService)

Capa de abstracción lógica para la comunicación HTTP centralizada entre el Frontend de React y el Backend de NestJS con respecto al módulo de gestión de identidades y accesos funcionales. 

## Ubicación
`src/services/usuarioService.ts`
*(Sus tipados de apoyo están en `src/types/usuario.ts`)*

## Arquitectura y Resiliencia ("First-API Fallback")
Este servicio está altamente acoplado a la URL base del backend dictada por el entorno local (`import.meta.env.VITE_API_URL` o el puerto colaborativo estricto `3000`).
Sin embargo, cuenta con un sistema robusto de Mock Backup en todas sus mutaciones (CRUD). 

**Flujo de red:**
1. Siempre inyecta el encabezado `Authorization: Bearer <token>` extraído de `localStorage`.
2. Llama a la API real.
3. Si el servidor devuelve `401 Unauthorized` (como ocurre cuando el login está parcialmente mockeado visualmente) o `ERR_CONNECTION_REFUSED`, el servicio intercepta la excepción para no quebrar el renderizado de la interfaz. 
4. Retorna inyecciones y alteraciones directas de la memoria local, simulando el éxito en un servidor para que el equipo de UI/UX pueda testear los modals `UserModal` libremente.

## Mutaciones (CRUD)

- **`getUsuarios(page, limit, search, filterRol)`**: 
  Obtiene todo el catálogo con filtrado inteligente, paginación simulada en cliente si es necesario y enrutado dinámico. Se mapea la data cruda del backend al modelo limpio `Usuario` (adaptando los roles a CamelCase/Upper y el campo `activo` a `estado`).
- **`crearUsuario(data: CrearUsuarioDTO)`**: 
  Muta datos adaptando el formato del formulario (inyecta el password por defecto `123456` para evitar rechazo en TypeORM si no fue provisto) y envía `POST /usuarios`.
- **`actualizarUsuario(id, data: ActualizarUsuarioDTO)`**: 
  Interpola campos a sobreescribir vía `PATCH /usuarios/:id`.
- **`eliminarUsuario(id)`**:
  Purga al empleado vía `DELETE /usuarios/:id`.

## Patrón de Respuesta 

Todos los métodos devuelven objetos estandarizados conformes a la interfaz `ApiResponse<T>`:
```ts
{
   data: T,         // Objeto retornado (e.g., Usuario o Usuario[])
   status: number,  // Código HTTP interpretado (200, 201)
   message: string  // Descripción para inyectar en Notificaciones Toasts.
}
```
