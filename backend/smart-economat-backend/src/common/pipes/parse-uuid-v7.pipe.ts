import { I18nHelper } from '../helpers/i18n.helper';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';

/**
 * ParseUUIDv7Pipe
 *
 * Pipe personalizado para validar y transformar UUIDs versión 7.
 *
 * UUID v7 utiliza un timestamp de 48 bits seguido de bits aleatorios,
 * lo que los hace cronológicamente ordenables. Esto mejora significativamente
 * el rendimiento de índices en bases de datos para inserciones masivas.
 *
 * Formato UUID v7: xxxxxxxx-xxxx-7xxx-[89ab]xxxxxxxxxxxxx
 * - Versión: 7 (bit 12-15 del time_hi_and_version field)
 * - Variante: 1 (bit 6-7 del clock_seq_hi_and_reserved field)
 *
 * @example
 *
 * @Get(':id')
 * findOne(@Param('id', ParseUUIDv7Pipe) id: string) {
 *   return this.service.findOne(id);
 * }
 *
 * @see https:
 */
@Injectable()
export class ParseUUIDv7Pipe implements PipeTransform<string | undefined> {
  /**
   * Expresión regular para validar UUID v7
   *
   * Desglose del patrón:
   * - ^[0-9a-f]{8}: Primer grupo - 8 hex digits
   * - - : Guion separador
   * - [0-9a-f]{4}: Segundo grupo - 4 hex digits
   * - - : Guion separador
   * - 7[0-9a-f]{3}: Tercer grupo - comienza con '7' (versión) + 3 hex digits
   * - - : Guion separador
   * - [89ab][0-9a-f]{3}: Cuarto grupo - variante (8,9,a,b) + 3 hex digits
   * - - : Guion separador
   * - [0-9a-f]{12}$: Quinto grupo - 12 hex digits
   */
  private static readonly UUID_V7_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /**
   * Transforma y valida el valor del parámetro
   *
   * @param value - El valor del parámetro a validar
   * @param _metadata - Metadatos del argumento (no usado)
   * @returns El valor validado
   * @throws BadRequestException si el valor no es un UUID v7 válido
   */
  transform(value: string | undefined): string {
    if (!value) {
      throw new BadRequestException(
        I18nHelper.getError('EL_UUID_NO_PUEDE_ESTAR_VAC_O')
      );
    }

    if (!isUUID(value, '7')) {
      throw new BadRequestException(
        `El valor '${value}' no es un UUID v7 válido`
      );
    }

    if (!ParseUUIDv7Pipe.UUID_V7_REGEX.test(value)) {
      throw new BadRequestException(
        `El valor '${value}' no tiene el formato correcto de UUID v7`
      );
    }

    return value;
  }
}
