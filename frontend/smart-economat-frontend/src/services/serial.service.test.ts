import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SerialService } from './serial.service';

describe('SerialService', () => {
  let serialService: SerialService;

  beforeEach(() => {
    serialService = new SerialService();
    // Restablecer el global navigator por defecto
    vi.stubGlobal('navigator', {});
  });

  describe('isSupported', () => {
    it('debería retornar false si navigator no está definido', () => {
      // Guardar navigator original
      const originalNavigator = global.navigator;
      // @ts-expect-error simulando comportamiento sin navigator
      delete global.navigator;

      expect(serialService.isSupported()).toBe(false);

      // Restaurar navigator
      global.navigator = originalNavigator;
    });

    it('debería retornar false si navigator.serial no está definido', () => {
      vi.stubGlobal('navigator', {});
      expect(serialService.isSupported()).toBe(false);
    });

    it('debería retornar true si navigator.serial está definido', () => {
      vi.stubGlobal('navigator', { serial: {} });
      expect(serialService.isSupported()).toBe(true);
    });
  });

  describe('getAuthorizedPorts', () => {
    it('debería retornar un arreglo vacío si serial no está soportado', async () => {
      vi.stubGlobal('navigator', {});
      const ports = await serialService.getAuthorizedPorts();
      expect(ports).toEqual([]);
    });

    it('debería llamar a navigator.serial.getPorts si está soportado', async () => {
      const mockGetPorts = vi.fn().mockResolvedValue(['port1', 'port2']);
      vi.stubGlobal('navigator', {
        serial: { getPorts: mockGetPorts },
      });

      const ports = await serialService.getAuthorizedPorts();
      expect(ports).toEqual(['port1', 'port2']);
      expect(mockGetPorts).toHaveBeenCalled();
    });
  });
});
