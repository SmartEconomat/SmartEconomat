import { ApiError, extractApiMessage } from '../services/api.service';
import i18n from '../i18n';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
 * Normaliza error message para mantener consistencia.
 *
 * @param error Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {unknown} error - Entrada efectiva esperada por el contrato.
 * @undefined {AuthAction} action - Entrada efectiva esperada por el contrato.
 * @undefined {string} fallbackMessage - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
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
