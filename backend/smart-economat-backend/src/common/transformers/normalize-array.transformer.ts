/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

/**
 * Representa normalize array transformer en el sistema.
 */
export class NormalizeArrayTransformer {
  /**
   * Ejecuta la lógica de transform dentro del flujo de la aplicación.
   *
   * @param params Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  static transform(params: { value: any }): any {
    const value = params.value;
    if (value === null) return null;
    if (value === undefined) return undefined;

    if (Array.isArray(value)) {
      return value
        .filter((item: unknown) => item != null)
        .map((item: unknown) =>
          typeof item === 'string' ? item.trim() : item
        );
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return undefined;
      return trimmed
        .split(',')
        .map((item): string => item.trim())
        .filter((item): item is string => item !== '');
    }

    return [value] as unknown[];
  }
}
