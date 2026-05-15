import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usuarioService } from '../../src/services/usuarioService';
import * as apiService from '../../src/services/api.service';
import type { CrearUsuarioDTO } from '../../src/types/usuario';

vi.mock('../../src/services/api.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/api.service')>();
  return {
    ...actual,
    baseFetch: vi.fn(),
    parseApiResponse: vi.fn(),
  };
});

const mockSuccessResponse = (
  data: Record<string, unknown> = { id: '1', username: 'test' }
) => {
  vi.mocked(apiService.baseFetch).mockResolvedValue({
    ok: true,
    status: 200,
  } as Response);
  vi.mocked(apiService.parseApiResponse).mockResolvedValue({
    success: true,
    data,
    message: 'OK',
  });
};

describe('usuarioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Tests existentes ────────────────────────────────────────────────────────

  describe('actualizarUsuario', () => {
    it('debe limpiar el payload de campos no permitidos antes de enviarlo al backend', async () => {
      mockSuccessResponse();

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

      const lastCall = vi.mocked(apiService.baseFetch).mock.calls[0];
      const body = JSON.parse(lastCall[1]?.body as string);

      expect(body.username).toBe('new_username');
      expect(body.nombre).toBe('Nuevo Nombre');
      expect(body.email).toBe('test@example.com');
      expect(body.rol).toBe('PROFESOR');
      expect(body.status).toBe('ACTIVE');

      expect(body.id).toBeUndefined();
      expect(body.roleId).toBeUndefined();
      expect(body.roleName).toBeUndefined();
      expect(body.permisosAdicionalesIds).toBeUndefined();
      expect(body.permisosExcluidosIds).toBeUndefined();
      expect(body.estado).toBeUndefined();
      expect(body.fecha_registro).toBeUndefined();
    });
  });

  describe('crearUsuario', () => {
    it('debe mapear correctamente los campos para la creación', async () => {
      vi.mocked(apiService.baseFetch).mockResolvedValue({
        ok: true,
        status: 201,
      } as Response);
      vi.mocked(apiService.parseApiResponse).mockResolvedValue({
        success: true,
        data: { id: 'new-id', username: 'new' },
        message: '',
      });

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
    });
  });

  // ─── Tests de seguridad: contraseñas ─────────────────────────────────────────

  describe('crearUsuario - sin contraseña por defecto hardcodeada', () => {
    it('no debe incluir Temp1234! en el payload cuando no se provee contraseña', async () => {
      vi.mocked(apiService.baseFetch).mockResolvedValue({
        ok: true,
        status: 201,
      } as Response);
      vi.mocked(apiService.parseApiResponse).mockResolvedValue({
        success: true,
        data: { id: 'new-id', username: 'new' },
        message: '',
      });

      await usuarioService.crearUsuario({
        username: 'usuario_test',
        email: 'usuario_test@test.local',
        rol: 'ALUMNO',
        estado: 'Activo',
      });

      const lastCall = vi.mocked(apiService.baseFetch).mock.calls[0];
      const body = JSON.parse(lastCall[1]?.body as string);

      expect(body.password).not.toBe('Temp1234!');
    });

    it('no debe incluir ninguna contraseña por defecto cuando el campo no se provee', async () => {
      vi.mocked(apiService.baseFetch).mockResolvedValue({
        ok: true,
        status: 201,
      } as Response);
      vi.mocked(apiService.parseApiResponse).mockResolvedValue({
        success: true,
        data: { id: 'new-id', username: 'new' },
        message: '',
      });

      await usuarioService.crearUsuario({
        username: 'usuario_test',
        email: 'usuario_test@test.local',
        rol: 'ALUMNO',
        estado: 'Activo',
      });

      const lastCall = vi.mocked(apiService.baseFetch).mock.calls[0];
      const body = JSON.parse(lastCall[1]?.body as string);

      expect(body.password).toBeUndefined();
    });

    it('sí debe incluir la contraseña explícita cuando el usuario la provee', async () => {
      vi.mocked(apiService.baseFetch).mockResolvedValue({
        ok: true,
        status: 201,
      } as Response);
      vi.mocked(apiService.parseApiResponse).mockResolvedValue({
        success: true,
        data: { id: 'new-id', username: 'new' },
        message: '',
      });

      const payload = {
        username: 'usuario_test',
        email: 'usuario_test@test.local',
        rol: 'ALUMNO',
        estado: 'Activo',
        password: 'MiPassword@99',
      };
      await usuarioService.crearUsuario(payload as unknown as CrearUsuarioDTO);

      const lastCall = vi.mocked(apiService.baseFetch).mock.calls[0];
      const body = JSON.parse(lastCall[1]?.body as string);

      expect(body.password).toBe('MiPassword@99');
    });
  });

  describe('resetPassword - generación segura de contraseñas', () => {
    it('debe usar crypto.getRandomValues en lugar de Math.random', async () => {
      mockSuccessResponse({ id: '1', username: 'test' });

      const cryptoSpy = vi.spyOn(crypto, 'getRandomValues');

      await usuarioService.resetPassword('user-1');

      expect(cryptoSpy).toHaveBeenCalled();
    });

    it('no debe llamar a Math.random durante la generación de contraseña', async () => {
      mockSuccessResponse({ id: '1', username: 'test' });

      const mathRandomSpy = vi.spyOn(Math, 'random');

      await usuarioService.resetPassword('user-1');

      expect(mathRandomSpy).not.toHaveBeenCalled();
    });

    it('la contraseña generada debe tener al menos 10 caracteres', async () => {
      mockSuccessResponse({ id: '1', username: 'test' });

      const result = await usuarioService.resetPassword('user-1');

      expect(result.data.length).toBeGreaterThanOrEqual(10);
    });

    it('la contraseña generada debe cumplir complejidad mínima (mayúscula, minúscula, número, símbolo)', async () => {
      mockSuccessResponse({ id: '1', username: 'test' });

      const result = await usuarioService.resetPassword('user-1');
      const password = result.data;

      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
      expect(/[!@#$%^&*]/.test(password)).toBe(true);
    });

    it('debe generar contraseñas distintas en llamadas sucesivas', async () => {
      mockSuccessResponse({ id: '1', username: 'test' });

      const r1 = await usuarioService.resetPassword('user-1');

      vi.clearAllMocks();
      mockSuccessResponse({ id: '1', username: 'test' });

      const r2 = await usuarioService.resetPassword('user-1');

      expect(r1.data).not.toBe(r2.data);
    });

    it('no debe generar Temp1234! como resultado posible', async () => {
      mockSuccessResponse({ id: '1', username: 'test' });

      const passwords = await Promise.all(
        Array.from({ length: 20 }, () => {
          vi.clearAllMocks();
          mockSuccessResponse({ id: '1', username: 'test' });
          return usuarioService.resetPassword('user-1').then((r) => r.data);
        })
      );

      expect(passwords.every((p) => p !== 'Temp1234!')).toBe(true);
    });

    it('debe enviar la contraseña generada al endpoint correcto', async () => {
      mockSuccessResponse({ id: '1', username: 'test' });

      await usuarioService.resetPassword('user-42');

      expect(apiService.baseFetch).toHaveBeenCalledWith(
        '/usuarios/user-42/password',
        expect.objectContaining({ method: 'PATCH' })
      );

      const lastCall = vi.mocked(apiService.baseFetch).mock.calls[0];
      const body = JSON.parse(lastCall[1]?.body as string);
      expect(typeof body.password).toBe('string');
      expect(body.password.length).toBeGreaterThanOrEqual(10);
    });
  });
});
