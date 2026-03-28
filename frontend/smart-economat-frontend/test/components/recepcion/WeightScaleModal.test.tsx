import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import WeightScaleModal from '../../../src/components/recepcion/WeightScaleModal';

describe('WeightScaleModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    isWeighing: false,
    capturedWeight: null,
    statusText: '',
    onStartWeighing: vi.fn(),
    onConfirmWeight: vi.fn(),
  };

  it('debería renderizar correctamente y mostrar 0.00 por defecto', () => {
    render(<WeightScaleModal {...defaultProps} />);

    expect(screen.getByText('0.00')).toBeDefined();
  });

  it('debería mostrar el peso capturado correctamente', () => {
    render(<WeightScaleModal {...defaultProps} capturedWeight={15.45} />);

    // 15.45 se muestra redondeado a 2 decimales
    expect(screen.getByText('15.45')).toBeDefined();
  });

  it('debería deshabilitar los botones de cerrar y capturar cuando está pesando', () => {
    render(<WeightScaleModal {...defaultProps} isWeighing={true} />);

    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find((b) => b.textContent === 'Cancelar');
    const captureBtn = buttons.find((b) => b.textContent === 'Recalcular');

    if (closeBtn) {
      expect((closeBtn as HTMLButtonElement).disabled).toBe(true);
    }
    if (captureBtn) {
      expect((captureBtn as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it('debería llamar a onConfirmWeight al hacer clic en Confirmar Peso', () => {
    const handleConfirm = vi.fn();
    render(
      <WeightScaleModal
        {...defaultProps}
        capturedWeight={12.5}
        onConfirmWeight={handleConfirm}
      />
    );

    const confirmBtn = screen.getByText(/Confirmar Peso/i);
    fireEvent.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
