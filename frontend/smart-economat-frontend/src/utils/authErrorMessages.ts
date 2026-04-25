import { ApiError, extractApiMessage } from '../services/api.service';
import i18n from '../i18n';

/**
 * @module authErrorMessages
 * Mapeo de errores de autenticación a claves i18n.
 *
 * Convierte mensajes de error raw de la API en cadenas localizadas
 * según la acción que originó el error.
 */

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
      'auth.errors.invalidCredentials',
    ],
    [/inactive|inactivo|pendiente/i, 'auth.errors.accountPending'],
    [/blocked|bloquead/i, 'auth.errors.accountBlocked'],
  ],
  forgotPassword: [[/email|correo/i, 'auth.errors.invalidEmail']],
  resetPassword: [
    [/token|expirad|inválid/i, 'auth.errors.invalidOrExpiredToken'],
  ],
  changePassword: [
    [
      /actual|current|incorrecta|incorrect/i,
      'auth.errors.invalidCurrentPassword',
    ],
  ],
  registerAlumno: [
    [/código|codigo|slot|clase/i, 'auth.errors.invalidClassCode'],
    [/capacity|cupo|ocupad/i, 'auth.errors.classFull'],
    [/taken|exist|username|usuario/i, 'auth.errors.usernameTaken'],
  ],
  registerProfesor: [
    [/cial/i, 'auth.errors.invalidCial'],
    [
      /taken|exist|username|usuario|email|correo/i,
      'auth.errors.userOrEmailTaken',
    ],
  ],
};

/**
 * Normaliza un error desconocido a un mensaje de texto plano.
 *
 * @param {unknown} error - Error capturado en un bloque catch.
 * @returns {string | null} Mensaje legible o `null` si no se puede extraer.
 */
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

/**
 * Obtiene el mensaje de error localizado para una acción de autenticación.
 *
 * Recorre el mapa de patrones de la acción hasta encontrar una coincidencia
 * con el mensaje raw. Si no hay coincidencia devuelve el fallback.
 *
 * @param {unknown} error - Error capturado (string, ApiError, Error u objeto).
 * @param {AuthAction} action - Acción que originó el error (p. ej. `'login'`).
 * @param {string} fallbackMessage - Mensaje a mostrar si no hay coincidencia.
 * @returns {string} Cadena traducida o el fallback.
 * @example
 * getAuthErrorMessage(err, 'login', t('toast.error')) // => 'Usuario o contraseña inválidos.'
 */
export function getAuthErrorMessage(
  error: unknown,
  action: AuthAction,
  fallbackMessage: string
): string {
  const rawMessage = normalizeErrorMessage(error);

  if (!rawMessage) {
    return fallbackMessage;
  }

  const matched = actionMessageMap[action]?.find(([pattern]) =>
    pattern.test(rawMessage)
  );

  if (matched) {
    return i18n.t(matched[1]);
  }

  return rawMessage || fallbackMessage;
}
