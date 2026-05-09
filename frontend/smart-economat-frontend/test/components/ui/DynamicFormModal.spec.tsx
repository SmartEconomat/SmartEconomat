import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import DynamicFormModal from '../../../src/components/ui/DynamicFormModal';
import { ThemeContextProvider } from '../../../src/store/ThemeContext';

import { vi, describe, it, expect } from 'vitest';

// Mock de i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('DynamicFormModal - Regresión de pérdida de estado', () => {
  const fields = [
    { name: 'testField', label: 'Test Field', type: 'text' as const },
  ];

  const Wrapper = ({
    initialData,
  }: {
    initialData: Record<string, unknown>;
  }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [, setRenderCount] = useState(0);

    return (
      <ThemeContextProvider>
        <button onClick={() => setRenderCount((prev) => prev + 1)}>
          Force Re-render
        </button>
        <DynamicFormModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          fields={[...fields]}
          initialData={{ ...initialData }}
          onSubmit={() => {}}
          title="Test Modal"
        />
      </ThemeContextProvider>
    );
  };

  it('debe mantener los datos introducidos por el usuario incluso si las props cambian de referencia', () => {
    render(<Wrapper initialData={{ testField: '' }} />);

    const input = screen.getByLabelText('Test Field');

    fireEvent.change(input, {
      target: { name: 'testField', value: 'Valor de usuario' },
    });
    expect(input).toHaveValue('Valor de usuario');

    const button = screen.getByText('Force Re-render');
    fireEvent.click(button);

    expect(screen.getByLabelText('Test Field')).toHaveValue('Valor de usuario');
  });
});
