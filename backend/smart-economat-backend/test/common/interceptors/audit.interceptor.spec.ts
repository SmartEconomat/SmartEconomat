import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TipoMovimiento } from 'src/modules/movimiento/enums/movimiento.enums';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let reflector: jest.Mocked<Reflector>;
  let eventEmitterEmit: jest.Mock;

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
    } as jest.Mocked<Reflector>;
    eventEmitterEmit = jest.fn();
    const eventEmitter: EventEmitter2 = {
      emit: eventEmitterEmit,
    } as EventEmitter2;
    interceptor = new AuditInterceptor(reflector, eventEmitter);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should pass through if no config is found', (done) => {
    reflector.get.mockReturnValue(null);
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn(),
    } as unknown as ExecutionContext;
    const mockNext = {
      handle: () => of('test-response'),
    } as CallHandler;

    interceptor.intercept(mockContext, mockNext).subscribe((res) => {
      expect(res).toBe('test-response');

      expect(eventEmitterEmit).not.toHaveBeenCalled();
      done();
    });
  });

  it('should emit audit event for POST request', (done) => {
    reflector.get.mockReturnValue({ entidad: 'Receta' });
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => ({
          method: 'POST',
          url: '/api/v1/recetas',
          user: { id: 'user-123' },
          params: {},
        }),
      }),
    } as unknown as ExecutionContext;

    const mockNext = {
      handle: () => of({ id: 'receta-456', nombre: 'Tarta' }),
    } as CallHandler;

    interceptor.intercept(mockContext, mockNext).subscribe((res) => {
      expect(res.id).toBe('receta-456');

      expect(eventEmitterEmit).toHaveBeenCalledWith(
        'audit.log',
        expect.objectContaining({
          userId: 'user-123',
          tipo: TipoMovimiento.ENTRADA,
          entidad: 'Receta',
          entidadId: 'receta-456',
          descripcion: 'Creación de receta (Tarta)',
        })
      );
      done();
    });
  });

  it('should resolve entity id from params and infer AJUSTE for PATCH', (done) => {
    reflector.get.mockReturnValue({ entidad: 'Producto' });
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => ({
          method: 'PATCH',
          url: '/api/v1/productos/prod-123',
          user: { id: 'user-321' },
          params: { id: 'prod-123' },
        }),
      }),
    } as unknown as ExecutionContext;

    const mockNext = {
      handle: () => of({ ok: true }),
    } as CallHandler;

    interceptor.intercept(mockContext, mockNext).subscribe((res) => {
      expect(res.ok).toBe(true);

      expect(eventEmitterEmit).toHaveBeenCalledWith(
        'audit.log',
        expect.objectContaining({
          userId: 'user-321',
          tipo: TipoMovimiento.AJUSTE,
          entidad: 'Producto',
          entidadId: 'prod-123',
        })
      );
      done();
    });
  });
});
