type AuthErrorContext =
  | 'login'
  | 'registerAlumno'
  | 'registerProfesor'
  | 'forgotPassword'
  | 'resetPassword'
  | 'changePassword';

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function extractMessage(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof Error && input.message) {
    return input.message;
  }

  return '';
}

export function getAuthErrorMessage(
  input: unknown,
  context: AuthErrorContext,
  fallbackMessage: string
): string {
  const rawMessage = extractMessage(input).trim();
  if (!rawMessage) {
    return fallbackMessage;
  }

  const message = normalizeText(rawMessage);

  if (
    message.includes('invalid credentials') ||
    message.includes('credenciales incorrectas') ||
    (context === 'login' && message.includes('no se pudo iniciar sesion'))
  ) {
    return 'Usuario o contraseña inválidos.';
  }

  if (
    message.includes('account inactive') ||
    message.includes('cuenta esta inactiva')
  ) {
    return 'Tu cuenta está inactiva. Espera a que un administrador la active.';
  }

  if (
    message.includes('account blocked') ||
    message.includes('cuenta ha sido bloqueada')
  ) {
    return 'Tu cuenta está bloqueada. Contacta con soporte o con un administrador.';
  }

  if (
    message.includes('token es invalido o ha expirado') ||
    message.includes('token es invalido') ||
    message.includes('token has expired')
  ) {
    return 'El enlace de recuperación es inválido o ya expiró.';
  }

  if (
    message.includes('contrasena actual es incorrecta') ||
    message.includes('invalid old password')
  ) {
    return 'La contraseña actual no es correcta.';
  }

  if (
    message.includes('debe ser un email valido') ||
    message.includes('el email es requerido') ||
    message.includes('valid email')
  ) {
    return 'Debes ingresar un correo electrónico válido.';
  }

  if (
    message.includes('user or email already exists') ||
    message.includes('user or email already registered') ||
    message.includes('usuario o email ya registrado') ||
    message.includes('username or email is already taken')
  ) {
    return context === 'registerAlumno'
      ? 'El nombre de usuario ya está registrado.'
      : 'El usuario o correo electrónico ya está registrado.';
  }

  if (
    message.includes('cial already exists') ||
    message.includes('cial already')
  ) {
    return 'El CIAL ingresado ya está registrado.';
  }

  if (
    message.includes('slot capacity reached') ||
    message.includes('ha alcanzado su capacidad maxima')
  ) {
    return 'La clase seleccionada ya no tiene cupos disponibles.';
  }

  if (
    message.includes('profesor no encontrado') ||
    message.includes('professor not found')
  ) {
    return 'No se encontró el profesor seleccionado.';
  }

  if (
    message.includes('la contrasena debe tener al menos 8') ||
    message.includes('debe tener al menos 8')
  ) {
    return 'La contraseña no cumple los requisitos mínimos de seguridad.';
  }

  if (
    message.includes('user not found') ||
    message.includes('usuario no encontrado')
  ) {
    if (context === 'login') {
      return 'El usuario ingresado no existe.';
    }
    return 'No se encontró el usuario indicado.';
  }

  return rawMessage;
}
