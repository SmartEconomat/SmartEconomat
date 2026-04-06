import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usuarioService } from '../../src/services/usuarioService';
import * as apiService from '../../src/services/api.service';

// Mock de baseFetch y parseApiResponse
vi.mock('../../src/services/api.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/api.service')>();
  return {
    ...actual,
    baseFetch: vi.fn(),
    parseApiResponse: vi.fn(),
  };
});

describe('usuarioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('actualizarUsuario', () => {
    it('debe limpiar el payload de campos no permitidos antes de enviarlo al backend', async () => {
      // Configuramos el mock de baseFetch para devolver una respuesta exitosa
      const mockResponse = { ok: true, status: 200 } as Response;
      const mockData = {
        success: true,
        data: { id: '1', username: 'test' },
        message: 'Updated',
      };

      vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);
      vi.mocked(apiService.parseApiResponse).mockResolvedValue(mockData);

      const updateData = {
        id: 'user-id-original',
        username: 'new_username',
        nombre: 'Nuevo Nombre',
        email: 'test@example.com',
        rol: 'PROFESOR',
        estado: 'Activo',
        roleId: 'some-role-id',
        roleName: 'PROFESOR',
        permisosAdicionalesIds: ['p1', 'p2'],
        permisosExcluidosIds: ['p3'],
        fecha_registro: '2021-01-01',
      };

      await usuarioService.actualizarUsuario(
        'user-id-original',
        updateData as Parameters<typeof usuarioService.actualizarUsuario>[1]
      );

      // Verificamos que baseFetch fue llamado con el payload LIMPIO
      expect(apiService.baseFetch).toHaveBeenCalledWith(
        '/usuarios/user-id-original',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"username":"new_username"'),
        })
      );

      const lastCall = vi.mocked(apiService.baseFetch).mock.calls[0];
      const body = JSON.parse(lastCall[1]?.body as string);

      // Campos que DEBEN estar
      expect(body.username).toBe('new_username');
      expect(body.nombre).toBe('Nuevo Nombre');
      expect(body.email).toBe('test@example.com');
      expect(body.rol).toBe('PROFESOR'); // Convertido a uppercase
      expect(body.status).toBe('ACTIVE'); // 'Activo' -> 'ACTIVE'

      // Campos que NO deben estar (whitelist del backend)
      expect(body.id).toBeUndefined();
      expect(body.roleId).toBeUndefined();
      expect(body.roleName).toBeUndefined();
      expect(body.permisosAdicionalesIds).toBeUndefined();
      expect(body.permisosExcluidosIds).toBeUndefined();
      expect(body.estado).toBeUndefined(); // Convertido a status
      expect(body.fecha_registro).toBeUndefined();
    });
  });

  describe('crearUsuario', () => {
    it('debe mapear correctamente los campos para la creación', async () => {
      const mockResponse = { ok: true, status: 201 } as Response;
      const mockData = {
        success: true,
        data: { id: 'new-id', username: 'new' },
        message: '',
      };

      vi.mocked(apiService.baseFetch).mockResolvedValue(mockResponse);
      vi.mocked(apiService.parseApiResponse).mockResolvedValue(mockData);

      const newData = {
        username: 'new_user',
        nombre: 'Nombre Nuevo',
        email: 'new@example.com',
        rol: 'ALUMNO',
        estado: 'Inactivo',
      };

      await usuarioService.crearUsuario(
        newData as Parameters<typeof usuarioService.crearUsuario>[0]
      );

      const lastCall = vi.mocked(apiService.baseFetch).mock.calls[0];
      const body = JSON.parse(lastCall[1]?.body as string);

      expect(body.username).toBe('new_user');
      expect(body.rol).toBe('ALUMNO');
      expect(body.status).toBe('INACTIVE');
      expect(body.password).toBeDefined(); // Contraseña temporal por defecto
    });
  });
});
