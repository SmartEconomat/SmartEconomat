import { HighTrafficAlertInterceptor } from './high-traffic-alert.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('HighTrafficAlertInterceptor', () => {
  let interceptor: HighTrafficAlertInterceptor;

  beforeEach(() => {
    interceptor = new HighTrafficAlertInterceptor();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debería estar definido', () => {
    expect(interceptor).toBeDefined();
  });

  it('debería detectar tráfico inusual y disparar una alerta', () => {
    const loggerSpy = jest.spyOn((interceptor as any).logger, 'error');

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-1' },
          path: '/test',
        }),
      }),
    } as unknown as ExecutionContext;

    const mockHandler: CallHandler = {
      handle: () => of(null),
    };

    for (let i = 0; i < 100; i++) {
      interceptor.intercept(mockContext, mockHandler);
    }

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[ALERTA TRAFICO] Usuario user-1 superó 100 peticiones'
      )
    );
  });

  it('debería resetear el contador después de la ventana de tiempo', () => {
    const loggerSpy = jest.spyOn((interceptor as any).logger, 'error');

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-2' },
          path: '/test',
        }),
      }),
    } as unknown as ExecutionContext;

    const mockHandler: CallHandler = {
      handle: () => of(null),
    };

    for (let i = 0; i < 50; i++) {
      interceptor.intercept(mockContext, mockHandler);
    }

    jest.advanceTimersByTime(11000);

    for (let i = 0; i < 60; i++) {
      interceptor.intercept(mockContext, mockHandler);
    }

    expect(loggerSpy).not.toHaveBeenCalled();
  });
});
