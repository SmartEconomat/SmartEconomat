import { describe, expect, it } from 'vitest';
import {
  RECETA_TIEMPO_MINIMO_MINUTOS,
  RECETA_TIEMPO_UMBRAL_60_PLUS_MINUTOS,
  normalizeRecetaTiempoMinutos,
  parseRequiredRecetaTiempoMinutos,
  getRecetaTiempoLabel,
  getRecetaTiempoFranjaLabel,
  getRecetaTiempoFilterRange,
} from '../../../src/features/recetas/receta-tiempo.utils';

const t = (key: string, options?: Record<string, unknown>) => {
  if (options?.count !== undefined) return `${key}:${options.count}`;
  return key;
};

describe('receta-tiempo.utils', () => {
  describe('normalizeRecetaTiempoMinutos', () => {
    it('retorna null para valor menor al mínimo', () => {
      expect(normalizeRecetaTiempoMinutos(9)).toBeNull();
      expect(normalizeRecetaTiempoMinutos(0)).toBeNull();
      expect(normalizeRecetaTiempoMinutos(-5)).toBeNull();
    });

    it('retorna null para valores no finitos o vacíos', () => {
      expect(normalizeRecetaTiempoMinutos(null)).toBeNull();
      expect(normalizeRecetaTiempoMinutos(undefined)).toBeNull();
      expect(normalizeRecetaTiempoMinutos('')).toBeNull();
      expect(normalizeRecetaTiempoMinutos(Infinity)).toBeNull();
      expect(normalizeRecetaTiempoMinutos(NaN)).toBeNull();
    });

    it('retorna el mínimo para el valor mínimo exacto', () => {
      expect(normalizeRecetaTiempoMinutos(RECETA_TIEMPO_MINIMO_MINUTOS)).toBe(
        RECETA_TIEMPO_MINIMO_MINUTOS
      );
    });

    it('redondea valores decimales al entero más cercano', () => {
      expect(normalizeRecetaTiempoMinutos(10.4)).toBe(10);
      expect(normalizeRecetaTiempoMinutos(10.5)).toBe(11);
      expect(normalizeRecetaTiempoMinutos(45.9)).toBe(46);
    });

    it('acepta valores numéricos como string', () => {
      expect(normalizeRecetaTiempoMinutos('30')).toBe(30);
      expect(normalizeRecetaTiempoMinutos('60')).toBe(60);
    });
  });

  describe('parseRequiredRecetaTiempoMinutos', () => {
    it('lanza error para valores inválidos', () => {
      expect(() => parseRequiredRecetaTiempoMinutos(9)).toThrow();
      expect(() => parseRequiredRecetaTiempoMinutos(null)).toThrow();
      expect(() => parseRequiredRecetaTiempoMinutos('')).toThrow();
    });

    it('retorna el valor para entradas válidas', () => {
      expect(parseRequiredRecetaTiempoMinutos(10)).toBe(10);
      expect(parseRequiredRecetaTiempoMinutos(30)).toBe(30);
      expect(parseRequiredRecetaTiempoMinutos(120)).toBe(120);
    });
  });

  describe('getRecetaTiempoLabel', () => {
    it('muestra el número de minutos para valores menores a 60', () => {
      const label = getRecetaTiempoLabel(10, t);
      expect(label).toContain('10');

      const label45 = getRecetaTiempoLabel(45, t);
      expect(label45).toContain('45');

      const label59 = getRecetaTiempoLabel(59, t);
      expect(label59).toContain('59');
    });

    it('muestra "60+" para valores >= umbral', () => {
      const label60 = getRecetaTiempoLabel(60, t);
      expect(label60).toContain('tiempoMinutos60Plus');
      expect(label60).toContain(`${RECETA_TIEMPO_UMBRAL_60_PLUS_MINUTOS}`);

      const label90 = getRecetaTiempoLabel(90, t);
      expect(label90).toContain('tiempoMinutos60Plus');
    });

    it('el umbral es exactamente 60', () => {
      const label59 = getRecetaTiempoLabel(59, t);
      const label60 = getRecetaTiempoLabel(60, t);
      expect(label59).not.toContain('tiempoMinutos60Plus');
      expect(label60).toContain('tiempoMinutos60Plus');
    });
  });

  describe('getRecetaTiempoFranjaLabel', () => {
    it('clasifica recetas rápidas (10-29 min)', () => {
      expect(getRecetaTiempoFranjaLabel(10, t)).toContain('franjaRapida');
      expect(getRecetaTiempoFranjaLabel(29, t)).toContain('franjaRapida');
    });

    it('clasifica recetas medias (30-59 min)', () => {
      expect(getRecetaTiempoFranjaLabel(30, t)).toContain('franjaMedia');
      expect(getRecetaTiempoFranjaLabel(59, t)).toContain('franjaMedia');
    });

    it('clasifica recetas largas (>= 60 min)', () => {
      expect(getRecetaTiempoFranjaLabel(60, t)).toContain('franjaLarga');
      expect(getRecetaTiempoFranjaLabel(90, t)).toContain('franjaLarga');
      expect(getRecetaTiempoFranjaLabel(120, t)).toContain('franjaLarga');
    });
  });

  describe('getRecetaTiempoFilterRange', () => {
    it('retorna rango vacío para filtro "all"', () => {
      expect(getRecetaTiempoFilterRange('all')).toEqual({});
    });

    it('retorna rango para recetas rápidas', () => {
      const range = getRecetaTiempoFilterRange('rapidas');
      expect(range.minTiempoMinutos).toBe(RECETA_TIEMPO_MINIMO_MINUTOS);
      expect(range.maxTiempoMinutos).toBe(29);
    });

    it('retorna rango para recetas medias', () => {
      const range = getRecetaTiempoFilterRange('medias');
      expect(range.minTiempoMinutos).toBe(30);
      expect(range.maxTiempoMinutos).toBe(
        RECETA_TIEMPO_UMBRAL_60_PLUS_MINUTOS - 1
      );
    });

    it('retorna sólo mínimo para recetas largas (sin techo)', () => {
      const range = getRecetaTiempoFilterRange('largas');
      expect(range.minTiempoMinutos).toBe(RECETA_TIEMPO_UMBRAL_60_PLUS_MINUTOS);
      expect(range.maxTiempoMinutos).toBeUndefined();
    });

    it('los rangos de rápidas y medias son consecutivos sin gaps', () => {
      const rapidas = getRecetaTiempoFilterRange('rapidas');
      const medias = getRecetaTiempoFilterRange('medias');
      expect(rapidas.maxTiempoMinutos! + 1).toBe(medias.minTiempoMinutos);
    });

    it('los rangos de medias y largas son consecutivos sin gaps', () => {
      const medias = getRecetaTiempoFilterRange('medias');
      const largas = getRecetaTiempoFilterRange('largas');
      expect(medias.maxTiempoMinutos! + 1).toBe(largas.minTiempoMinutos);
    });
  });
});
