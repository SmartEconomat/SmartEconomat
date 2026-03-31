import { HighTrafficAlertInterceptor } from './high-traffic-alert.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('HighTrafficAlertInterceptor', () => {
  let interceptor: HighTrafficAlertInterceptor;
  let prevNodeEnv: string | undefined;
  let prevJestWorker: string | undefined;

  beforeEach(() => {
    prevNodeEnv = process.env.NODE_ENV;
    prevJestWorker = process.env.JEST_WORKER_ID;
    process.env.NODE_ENV = 'production';
    delete process.env.JEST_WORKER_ID;
    interceptor = new HighTrafficAlertInterceptor();
    jest.useFakeTimers();
  });

  afterEach(() => {
    process.env.NODE_ENV = prevNodeEnv;
    if (prevJestWorker !== undefined) {
      process.env.JEST_WORKER_ID = prevJestWorker;
    } else {
      delete process.env.JEST_WORKER_ID;
    }
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
