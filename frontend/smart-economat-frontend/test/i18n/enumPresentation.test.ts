import { describe, expect, it } from 'vitest';
import { getEnumLabel } from '../../src/i18n/enumPresentation';

const buildT =
  (dictionary: Record<string, string>) =>
  (key: string, options?: { defaultValue?: string }) =>
    dictionary[key] ?? options?.defaultValue ?? key;

describe('enumPresentation', () => {
  it('resolves translated label from canonical enum key', () => {
    const t = buildT({
      'enum.pedidoEstado.PENDIENTE_DE_APROBACION': 'Pendiente de aprobación',
    });

    expect(
      getEnumLabel(t as never, 'pedidoEstado', 'pendiente_de_aprobacion')
    ).toBe('Pendiente de aprobación');
  });

  it('normalizes spaces before lookup', () => {
    const t = buildT({
      'enum.movimientoTipo.ENTRADA_DISTRIBUCION': 'Entrada por distribución',
    });

    expect(
      getEnumLabel(t as never, 'movimientoTipo', 'entrada distribucion')
    ).toBe('Entrada por distribución');
  });

  it('falls back to humanized value when translation key is missing', () => {
    const t = buildT({});
    expect(getEnumLabel(t as never, 'rolUsuario', 'super_admin')).toBe(
      'Super Admin'
    );
  });

  it('returns em dash for empty enum values', () => {
    const t = buildT({});
    expect(getEnumLabel(t as never, 'pedidoEstado', '')).toBe('—');
    expect(getEnumLabel(t as never, 'pedidoEstado', null)).toBe('—');
  });

  it('falls back to humanized label when i18n returns raw key', () => {
    const tReturnsKey = (key: string) => key;
    expect(
      getEnumLabel(
        tReturnsKey as never,
        'recetaDificultad',
        'pendiente_de_aprobacion'
      )
    ).toBe('Pendiente De Aprobacion');
  });
});
