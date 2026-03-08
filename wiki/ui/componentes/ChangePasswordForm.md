# Documentación de Componente: ChangePasswordForm

**Tipo:** Componente de formulario / Seguridad (Feature)  
**Ubicación:** `src/features/profile/components/ChangePasswordForm.tsx`  

---

## Descripción General

`ChangePasswordForm` es el submódulo del layout de Perfil que se encarga de interceptar la vieja contraseña, requerir el nuevo conjunto de credenciales y delegar a la capa asíncrona JWT de seguridad.

---

## Interacciones Reactivas

### Feedback en Tiempo Real
1. **Longitud Mínima:** Verifica localmente (`useEffect`) que la cadena alcance el estándar estricto del sistema para ser `true` y emite el *HelperText* "Longitud correcta".
2. **Validación Cruzada (Matching):** Revisa el cruce de firmas entre las dos contraseñas nuevas garantizando al usuario una interfaz sin conjeturas: *"Las contraseñas coinciden"*.

### Evitar Saltos Visuales de Capa (Jumping Effect)
Dado que los textos condicionales pre-alertan cambios en el flujo DOM, el formulario establece su altura base forzando márgenes falsos en las cadenas usando default states con espacio vacío: `helperText=" "`, evitando así el empuje anti-ergonómico de los elementos circundantes al aparecer un texto de 0 caracteres a N caracteres.

---

## API Interfaces

| Método  | Endpoint                           | Body Esperado |
|---------|------------------------------------|---------------|
| `PATCH` | `/v1/usuarios/perfil/password` | `oldPassword`, `newPassword` |
