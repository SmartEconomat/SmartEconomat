import { describe, it, expect } from 'vitest';
import { buildPedidoPermissions } from '../../../../src/features/pedidos/utils/pedidoPermissions';

describe('buildPedidoPermissions', () => {
  describe('separación de permisos (anti-escalación)', () => {
    it('canCancel debe ser independiente de canEdit', () => {
      const perms = buildPedidoPermissions(false, true, false, false, false);
      expect(perms.canEdit).toBe(true);
      expect(perms.canCancel).toBe(false);
    });

    it('canApprove debe ser independiente de canEdit', () => {
      const perms = buildPedidoPermissions(false, true, false, false, false);
      expect(perms.canApprove).toBe(false);
    });

    it('usuario con permiso de editar pero sin cancelar: canEdit=true, canCancel=false', () => {
      const perms = buildPedidoPermissions(false, true, false, false, false);
      expect(perms.canEdit).toBe(true);
      expect(perms.canCancel).toBe(false);
      expect(perms.canApprove).toBe(false);
    });

    it('usuario con permiso de cancelar sin editar: canCancel=true, canEdit=false', () => {
      const perms = buildPedidoPermissions(false, false, false, true, false);
      expect(perms.canCancel).toBe(true);
      expect(perms.canEdit).toBe(false);
    });

    it('usuario con permiso de cancelar y aprobar sin editar', () => {
      const perms = buildPedidoPermissions(false, false, false, true, true);
      expect(perms.canCancel).toBe(true);
      expect(perms.canApprove).toBe(true);
      expect(perms.canEdit).toBe(false);
    });

    it('todos los permisos en true deben pasarse correctamente', () => {
      const perms = buildPedidoPermissions(true, true, true, true, true);
      expect(perms).toEqual({
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canCancel: true,
        canApprove: true,
      });
    });

    it('todos los permisos en false: ninguna acción permitida', () => {
      const perms = buildPedidoPermissions(false, false, false, false, false);
      expect(Object.values(perms).every((v) => v === false)).toBe(true);
    });

    it('REGRESIÓN: canCancel no debe igualar canEdit cuando se pasa false explícitamente', () => {
      const perms = buildPedidoPermissions(true, true, true, false, false);
      expect(perms.canCancel).toBe(false);
      expect(perms.canApprove).toBe(false);
      // Bug anterior: ambos habrían sido true porque canEdit=true
    });

    it('REGRESIÓN: canApprove no debe igualar canEdit cuando se pasa false explícitamente', () => {
      const perms = buildPedidoPermissions(false, true, false, false, false);
      expect(perms.canApprove).toBe(false);
      // Bug anterior: habría devuelto true porque canEdit=true
    });
  });

  describe('integridad del objeto resultado', () => {
    it('devuelve exactamente las cinco propiedades del contrato PedidoPermissions', () => {
      const perms = buildPedidoPermissions(true, false, true, false, true);
      const keys = Object.keys(perms).sort();
      expect(keys).toEqual(
        ['canApprove', 'canCancel', 'canCreate', 'canDelete', 'canEdit'].sort()
      );
    });

    it('cada propiedad refleja exactamente el valor pasado como argumento', () => {
      const perms = buildPedidoPermissions(true, false, true, false, true);
      expect(perms.canCreate).toBe(true);
      expect(perms.canEdit).toBe(false);
      expect(perms.canDelete).toBe(true);
      expect(perms.canCancel).toBe(false);
      expect(perms.canApprove).toBe(true);
    });
  });
});
