import { describe, it, expect } from 'vitest';
import {
  buildVideoConstraintAttempts,
  isPermissionError,
  isNoCameraError,
  isRetriableCameraStartError,
} from '../../../src/components/ui/BarcodeScanner';

describe('BarcodeScanner helpers', () => {
  it('construye intentos de constraints degradados para una cámara concreta', () => {
    const attempts = buildVideoConstraintAttempts('cam-1');

    expect(attempts).toHaveLength(4);
    expect(attempts[0]).toMatchObject({
      deviceId: { exact: 'cam-1' },
    });
    expect(attempts[1]).toMatchObject({
      deviceId: { ideal: 'cam-1' },
    });
    expect(attempts[2]).toMatchObject({
      facingMode: { ideal: 'environment' },
    });
    expect(attempts[3]).toBe(true);
  });

  it('construye fallback mínimo cuando no hay deviceId', () => {
    const attempts = buildVideoConstraintAttempts('   ');

    expect(attempts).toHaveLength(2);
    expect(attempts[0]).toMatchObject({
      facingMode: { ideal: 'environment' },
    });
    expect(attempts[1]).toBe(true);
  });

  it('clasifica correctamente errores de permisos', () => {
    expect(
      isPermissionError(
        new DOMException('Permission denied', 'NotAllowedError')
      )
    ).toBe(true);
    expect(isPermissionError(new Error('permission denied by user'))).toBe(
      true
    );
    expect(
      isPermissionError(new DOMException('No camera found', 'NotFoundError'))
    ).toBe(false);
  });

  it('clasifica correctamente errores sin cámara', () => {
    expect(
      isNoCameraError(new DOMException('No camera found', 'NotFoundError'))
    ).toBe(true);
    expect(isNoCameraError(new Error('no camera available'))).toBe(true);
    expect(
      isNoCameraError(new DOMException('Permission denied', 'NotAllowedError'))
    ).toBe(false);
  });

  it('detecta errores recuperables de inicio de cámara', () => {
    expect(
      isRetriableCameraStartError(
        new DOMException('Constraint mismatch', 'OverconstrainedError')
      )
    ).toBe(true);
    expect(
      isRetriableCameraStartError(new Error('Could not start video source'))
    ).toBe(true);
    expect(
      isRetriableCameraStartError(
        new DOMException('Permission denied', 'NotAllowedError')
      )
    ).toBe(false);
  });
});
