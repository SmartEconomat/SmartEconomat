import { describe, expect, it } from 'vitest';
import {
  getMovimientoUsuarioDisplayName,
  getMovimientoUsuarioInitial,
} from '../../../src/features/movimientos/movimiento-formatters';
import type { UsuarioBasico } from '../../../src/services/movimiento.types';

describe('movimiento-formatters', () => {
  describe('getMovimientoUsuarioDisplayName', () => {
    it('prioriza nombre sobre username y email', () => {
      const usuario: UsuarioBasico = {
        id: 'u1',
        nombre: '  Ana  ',
        username: 'ana.user',
        email: 'ana@example.com',
      };
      expect(getMovimientoUsuarioDisplayName(usuario)).toBe('Ana');
    });

    it('usa username si no hay nombre', () => {
      const usuario: UsuarioBasico = {
        id: 'u2',
        username: 'solo.user',
      };
      expect(getMovimientoUsuarioDisplayName(usuario)).toBe('solo.user');
    });

    it('usa email si solo viene email', () => {
      const usuario: UsuarioBasico = {
        id: 'u3',
        email: 'mail@example.com',
      };
      expect(getMovimientoUsuarioDisplayName(usuario)).toBe('mail@example.com');
    });

    it('devuelve em-dash sin datos', () => {
      expect(getMovimientoUsuarioDisplayName(undefined)).toBe('—');
    });
  });

  describe('getMovimientoUsuarioInitial', () => {
    it('devuelve U cuando no hay identificador', () => {
      expect(getMovimientoUsuarioInitial(undefined)).toBe('U');
    });

    it('toma la primera letra del nombre mostrado en mayúsculas', () => {
      const usuario: UsuarioBasico = {
        id: 'u1',
        nombre: 'beta',
      };
      expect(getMovimientoUsuarioInitial(usuario)).toBe('B');
    });
  });
});
