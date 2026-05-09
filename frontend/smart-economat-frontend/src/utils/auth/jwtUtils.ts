interface JwtPayload {
  exp?: number;
}

const decodeBase64Url = (value: string): string | null => {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '='
    );
    return atob(padded);
  } catch {
    return null;
  }
};

/**
 * Obtiene valores o vistas materializadas.
 * @undefined {string | null} token - Entrada efectiva esperada por el contrato.
 * @undefined {JwtPayload | null} Datos efectivos después de ejecutar la operación.
 */
export const getJwtPayload = (token: string | null): JwtPayload | null => {
  if (!token) {
    return null;
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    return null;
  }

  const decodedPayload = decodeBase64Url(segments[1]);
  if (!decodedPayload) {
    return null;
  }

  try {
    return JSON.parse(decodedPayload) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Expone "isJwtUsable" en smart-economat-frontend (SPA).
 * @undefined {string | null} token - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export const isJwtUsable = (token: string | null): boolean => {
  const payload = getJwtPayload(token);
  if (!payload) {
    return false;
  }

  if (typeof payload.exp !== 'number') {
    return true;
  }

  return payload.exp * 1000 > Date.now();
};
