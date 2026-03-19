import { ApiError, extractApiMessage } from '../services/api.service';

type AuthAction =
  | 'login'
  | 'forgotPassword'
  | 'resetPassword'
  | 'changePassword'
  | 'registerAlumno'
  | 'registerProfesor';

const actionMessageMap: Record<AuthAction, Array<[RegExp, string]>> = {
  login: [
    [
      /invalid|inválid|credenciales|contraseña|password/i,
      'Usuario o contraseña inválidos.',
    ],
    [
      /inactive|inactivo|pendiente/i,
      'Tu cuenta aún está pendiente de activación.',
    ],
    [
      /blocked|bloquead/i,
      'Tu cuenta está bloqueada. Contacta al administrador.',
    ],
  ],
  forgotPassword: [
    [
      /email|correo/i,
      'Introduce un correo electrónico válido para recuperar tu contraseña.',
    ],
  ],
  resetPassword: [
    [
      /token|expirad|inválid/i,
      'El enlace para restablecer la contraseña no es válido o ha expirado.',
    ],
  ],
  changePassword: [
    [
      /actual|current|incorrecta|incorrect/i,
      'La contraseña actual no es correcta.',
    ],
  ],
  registerAlumno: [
    [
      /código|codigo|slot|clase/i,
      'El código de la clase no es válido o ya no está disponible.',
    ],
    [/capacity|cupo|ocupad/i, 'Esta clase ya no tiene plazas disponibles.'],
    [/taken|exist|username|usuario/i, 'Ese nombre de usuario ya está en uso.'],
  ],
  registerProfesor: [
    [/cial/i, 'El CIAL ingresado ya existe o no es válido.'],
    [
      /taken|exist|username|usuario|email|correo/i,
      'El usuario o correo ya están registrados.',
    ],
  ],
};

function normalizeErrorMessage(error: unknown): string | null {
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  if (error instanceof ApiError) {
    return extractApiMessage(error.payload) || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return extractApiMessage(error);
}

export function getAuthErrorMessage(
  error: unknown,
  action: AuthAction,
  fallbackMessage: string
): string {
  const rawMessage = normalizeErrorMessage(error);

  if (!rawMessage) {
    return fallbackMessage;
  }

  const mappedMessage = actionMessageMap[action].find(([pattern]) =>
    pattern.test(rawMessage)
  );

  return mappedMessage?.[1] || rawMessage || fallbackMessage;
}
