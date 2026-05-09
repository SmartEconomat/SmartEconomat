import { LanguageEnum } from '../../../../common/enums/languages/language.enum';

/** Constantes públicas (RecepcionMessages) expuestas en smart-economat-backend (Nest). */
export const RecepcionMessages = {
  ERRORS: {
    NOT_FOUND: 'Recepción no encontrada',
  },
  SWAGGER: {
    TAG: 'Recepcion Stock',
    CREATE_SUMMARY: 'Procesar recepción de stock vinculada a un pedido',
    CREATE_SUCCESS: 'Recepción procesada correctamente.',
    CREATE_BAD_REQUEST: 'Datos inválidos o error en el proceso.',
    DTO: {
      LINEA_PEDIDO_PRODUCTO_ID: 'ID del producto del pedido',
      LINEA_CANTIDAD_RECIBIDA: 'Cantidad recibida',
      LINEA_OBSERVACIONES: 'Observaciones de la línea',
      PEDIDO_ID: 'ID del pedido',
      N_ALBARAN: 'Número de albarán',
      LINEAS: 'Líneas de recepción',
    },
  },
};

/** Mensaje de recepción: cadena simple o objeto anidado (p. ej. SWAGGER). */
export type RecepcionMessageValue =
  (typeof RecepcionMessages)[keyof typeof RecepcionMessages];

export function getRecepcionMessage<Key extends keyof typeof RecepcionMessages>(
  key: Key,
  lang: string = LanguageEnum.ES,
  ...args: unknown[]
): RecepcionMessageValue {
  if (lang !== LanguageEnum.ES) {
    console.warn(`Language '${lang}' not supported, falling back to 'es'.`);
  }

  const message = RecepcionMessages[key];

  if (typeof message === 'function') {
    const fn = message as (...fnArgs: unknown[]) => unknown;
    return fn(...args) as RecepcionMessageValue;
  }

  return message;
}
