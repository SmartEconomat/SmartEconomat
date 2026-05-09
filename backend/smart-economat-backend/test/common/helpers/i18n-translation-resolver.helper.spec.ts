import { I18nService } from 'nestjs-i18n';
import {
  normalizeI18nLang,
  safeTranslate,
  translateEnumValue,
} from 'src/common/helpers/i18n-translation-resolver.helper';

describe('i18n-translation-resolver.helper', () => {
  it('normalizes regional locales to supported language', () => {
    expect(normalizeI18nLang('es-ES')).toBe('es');
    expect(normalizeI18nLang('en_GB')).toBe('en');
    expect(normalizeI18nLang('pt-BR')).toBe('es');
  });

  it('safeTranslate falls back when i18n returns raw key', () => {
    const i18n = {
      t: jest.fn().mockReturnValue('pdf.receta.dificultad'),
    } as unknown as I18nService;

    expect(
      safeTranslate(i18n, 'pdf.receta.dificultad', 'es-ES', 'Dificultad')
    ).toBe('Dificultad');
  });

  it('translateEnumValue resolves enum labels with normalized locale', () => {
    const i18n = {
      t: jest.fn().mockImplementation((key: string) => {
        if (key === 'enum.recetaDificultad.DIFICIL') {
          return 'Difícil';
        }
        return key;
      }),
    } as unknown as I18nService;

    expect(
      translateEnumValue(i18n, 'recetaDificultad', 'difícil', 'es-ES')
    ).toBe('Difícil');
  });
});
