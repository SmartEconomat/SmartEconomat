import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { usePermission } from '../../src/hooks/usePermission';
import { AuthContext } from '../../src/sherlock-auth/context';
import type { AuthContextType } from '../../src/sherlock-auth/types';
import * as storeHooks from '../../src/store/hooks';

vi.mock('../../src/store/hooks', () => ({
  useAppSelector: vi.fn(),
}));

/**
 * Crea un wrapper de React que provee el AuthContext con el rol indicado.
 * Pasar null simula usuario no autenticado (context.user = null).
 */
const makeWrapper =
  (rol: string | null) =>
  ({ children }: { children: ReactNode }) =>
    createElement(AuthContext.Provider, {
      value: {
        isAuthenticated: rol !== null,
        isAuthResolved: true,
        isSessionVerified: rol !== null,
        user: rol
          ? {
              id: 'test-user',
              name: 'Test User',
              email: 'test@example.com',
              rol,
              permisos: [],
            }
          : null,
        login: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi
          .fn()
          .mockResolvedValue(null) as AuthContextType['refreshUser'],
        updateUser: vi.fn() as AuthContextType['updateUser'],
        changeLanguage: vi
          .fn()
          .mockResolvedValue(undefined) as AuthContextType['changeLanguage'],
      } satisfies AuthContextType,
      children,
    });

describe('usePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storeHooks.useAppSelector).mockReturnValue({});
  });

  describe('fail-closed — undefined / string vacío / array vacío', () => {
    it('debe devolver false cuando se pasa undefined', () => {
      const { result } = renderHook(() => usePermission(undefined), {
        wrapper: makeWrapper('PROFESOR'),
      });
      expect(result.current).toBe(false);
    });

    it('debe devolver false cuando se pasa string vacío', () => {
      const { result } = renderHook(() => usePermission(''), {
        wrapper: makeWrapper('PROFESOR'),
      });
      expect(result.current).toBe(false);
    });

    it('debe devolver false cuando se pasa array vacío', () => {
      const { result } = renderHook(() => usePermission([]), {
        wrapper: makeWrapper('PROFESOR'),
      });
      expect(result.current).toBe(false);
    });

    // Regresión: el bug anterior devolvía true con undefined (fail-open)
    it('REGRESIÓN: undefined no debe conceder acceso', () => {
      const { result } = renderHook(() => usePermission(undefined), {
        wrapper: makeWrapper('PROFESOR'),
      });
      expect(result.current).toBe(false);
    });

    // Regresión: el bug anterior devolvía true con array vacío (fail-open)
    it('REGRESIÓN: array vacío no debe conceder acceso', () => {
      const { result } = renderHook(() => usePermission([]), {
        wrapper: makeWrapper('PROFESOR'),
      });
      expect(result.current).toBe(false);
    });
  });

  describe('permiso ausente o denegado en el mapa', () => {
    it('debe devolver false cuando el permiso no existe en el mapa', () => {
      vi.mocked(storeHooks.useAppSelector).mockReturnValue({});
      const { result } = renderHook(() => usePermission('pedidos:cancelar'), {
        wrapper: makeWrapper('PROFESOR'),
      });
      expect(result.current).toBe(false);
    });

    it('debe devolver false cuando el permiso está explícitamente en false', () => {
      vi.mocked(storeHooks.useAppSelector).mockReturnValue({
        'pedidos:cancelar': false,
      });
      const { result } = renderHook(() => usePermission('pedidos:cancelar'), {
        wrapper: makeWrapper('PROFESOR'),
      });
      expect(result.current).toBe(false);
    });

    it('debe devolver false si algún permiso del array falta en el mapa', () => {
      vi.mocked(storeHooks.useAppSelector).mockReturnValue({
        'pedidos:cancelar': true,
        // 'pedidos:editar' ausente
      });
      const { result } = renderHook(
        () => usePermission(['pedidos:cancelar', 'pedidos:editar']),
        { wrapper: makeWrapper('PROFESOR') }
      );
      expect(result.current).toBe(false);
    });
  });

  describe('permiso concedido', () => {
    it('debe devolver true cuando el permiso existe y está activo', () => {
      vi.mocked(storeHooks.useAppSelector).mockReturnValue({
        'pedidos:cancelar': true,
      });
      const { result } = renderHook(() => usePermission('pedidos:cancelar'), {
        wrapper: makeWrapper('PROFESOR'),
      });
      expect(result.current).toBe(true);
    });

    it('debe devolver true cuando todos los permisos del array están en el mapa', () => {
      vi.mocked(storeHooks.useAppSelector).mockReturnValue({
        'pedidos:cancelar': true,
        'pedidos:editar': true,
      });
      const { result } = renderHook(
        () => usePermission(['pedidos:cancelar', 'pedidos:editar']),
        { wrapper: makeWrapper('PROFESOR') }
      );
      expect(result.current).toBe(true);
    });

    it('array con un único permiso presente devuelve true', () => {
      vi.mocked(storeHooks.useAppSelector).mockReturnValue({
        'pedidos:crear': true,
      });
      const { result } = renderHook(() => usePermission(['pedidos:crear']), {
        wrapper: makeWrapper('PROFESOR'),
      });
      expect(result.current).toBe(true);
    });
  });

  describe('roles elevados (bypass de permisos)', () => {
    it('ADMIN omite el mapa y devuelve true', () => {
      vi.mocked(storeHooks.useAppSelector).mockReturnValue({});
      const { result } = renderHook(() => usePermission('pedidos:cancelar'), {
        wrapper: makeWrapper('ADMIN'),
      });
      expect(result.current).toBe(true);
    });

    it('SUPER_ADMIN omite el mapa y devuelve true', () => {
      vi.mocked(storeHooks.useAppSelector).mockReturnValue({});
      const { result } = renderHook(() => usePermission('pedidos:eliminar'), {
        wrapper: makeWrapper('SUPER_ADMIN'),
      });
      expect(result.current).toBe(true);
    });

    it('ADMIN con permiso undefined devuelve true (bypass por rol elevado, antes del guard fail-closed)', () => {
      vi.mocked(storeHooks.useAppSelector).mockReturnValue({});
      const { result } = renderHook(() => usePermission(undefined), {
        wrapper: makeWrapper('ADMIN'),
      });
      // El check de rol elevado precede al guard fail-closed: ADMIN siempre accede
      expect(result.current).toBe(true);
    });

    it('PROFESOR sin permiso específico no recibe bypass de rol', () => {
      vi.mocked(storeHooks.useAppSelector).mockReturnValue({});
      const { result } = renderHook(() => usePermission('pedidos:cancelar'), {
        wrapper: makeWrapper('PROFESOR'),
      });
      expect(result.current).toBe(false);
    });
  });

  describe('usuario no autenticado (sin contexto)', () => {
    it('sin Provider de AuthContext no lanza error y devuelve false para permisos no admin', () => {
      vi.mocked(storeHooks.useAppSelector).mockReturnValue({});
      // Sin wrapper, AuthContext devuelve undefined → userRole = undefined → no es admin
      const { result } = renderHook(() => usePermission('pedidos:cancelar'));
      expect(result.current).toBe(false);
    });

    it('con user null y permiso ausente devuelve false', () => {
      vi.mocked(storeHooks.useAppSelector).mockReturnValue({});
      const { result } = renderHook(() => usePermission('pedidos:cancelar'), {
        wrapper: makeWrapper(null),
      });
      expect(result.current).toBe(false);
    });
  });
});
