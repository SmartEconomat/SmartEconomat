import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Proveedor } from '../../../src/services/proveedor.types';
import QuickProveedorModal from '../../../src/components/ui/QuickProveedorModal';
import DynamicFormModal, {
  DynamicField,
  FormDataRecord,
} from '../../../src/components/ui/DynamicFormModal';

const createProveedorMock = vi.fn();
const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

vi.mock('../../../src/store/auth.hooks', () => ({
  usePermission: () => true,
}));

vi.mock('../../../src/store/toast.hooks', () => ({
  useToast: () => toastMock,
}));

vi.mock('../../../src/services/proveedor.service', () => ({
  createProveedor: (...args: unknown[]) => createProveedorMock(...args),
}));

const INVENTORY_CONFIRMATION_MESSAGE =
  '¿Estás seguro de que deseas añadir este nuevo producto al inventario?';

const productFields: DynamicField[] = [
  {
    name: 'nombre',
    label: 'Nombre Comercial',
    required: true,
    defaultValue: 'Producto QA',
  },
  {
    name: 'proveedores',
    label: 'Proveedores Asociados',
    type: 'proveedores',
    position: 'bottom',
    defaultValue: [],
    options: [
      {
        value: 'prov-base',
        label: 'Proveedor base',
      },
    ],
  },
];

interface ProductHarnessProps {
  onSubmit?: (data: FormDataRecord) => void | Promise<void>;
}

interface QuickProveedorNestedHarnessProps {
  onParentSubmit: () => void;
}

const QuickProveedorNestedHarness = ({
  onParentSubmit,
}: QuickProveedorNestedHarnessProps) => (
  <form
    onSubmit={(event) => {
      event.preventDefault();
      onParentSubmit();
    }}
  >
    <QuickProveedorModal
      isOpen
      onClose={() => undefined}
      onSuccess={() => undefined}
    />
  </form>
);

const ProductHarness = ({ onSubmit = vi.fn() }: ProductHarnessProps) => (
  <DynamicFormModal
    isOpen
    onClose={vi.fn()}
    title="Crear producto QA"
    fields={productFields}
    initialData={{ nombre: 'Producto QA', proveedores: [] }}
    onSubmit={onSubmit}
    submitLabel="Guardar Producto"
    requireConfirmation
    confirmationMessage={INVENTORY_CONFIRMATION_MESSAGE}
  />
);

describe('DynamicFormModal - submit anidado y confirmación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const createdProveedor: Proveedor = {
      id: 'prov-quick-1',
      nombre: 'Proveedor rápido QA',
      nif: 'A12345678',
    };
    createProveedorMock.mockResolvedValue(createdProveedor);
  });

  it('no propaga el submit al formulario padre al enviar el modal rápido de proveedor', async () => {
    const parentOnSubmit = vi.fn();

    render(<QuickProveedorNestedHarness onParentSubmit={parentOnSubmit} />);

    const nifInput = (await screen.findByRole('textbox', {
      name: /nif\s*\/\s*cuit|proveedores\.form\.nifCuit/i,
    })) as HTMLInputElement;
    const nombreInput = (await screen.findByRole('textbox', {
      name: /raz[oó]n social|proveedores\.form\.razonSocial/i,
    })) as HTMLInputElement;

    await userEvent.type(nifInput, 'A12345678');
    await userEvent.type(nombreInput, 'Proveedor rápido QA');

    await userEvent.click(
      screen.getByRole('button', { name: /aceptar|comun\.aceptar/i })
    );

    await waitFor(
      () => {
        expect(createProveedorMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 10000 }
    );

    expect(parentOnSubmit).not.toHaveBeenCalled();
  }, 15000);

  it('el botón + de proveedor no dispara submit del formulario padre', async () => {
    const parentOnSubmit = vi.fn();

    render(<ProductHarness onSubmit={parentOnSubmit} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Crear nuevo proveedor' })
    );

    expect(parentOnSubmit).not.toHaveBeenCalled();
    expect(
      screen.queryByText(INVENTORY_CONFIRMATION_MESSAGE)
    ).not.toBeInTheDocument();
  });

  it('mantiene la confirmación al enviar el formulario principal de producto', async () => {
    const parentOnSubmit = vi.fn();

    render(<ProductHarness onSubmit={parentOnSubmit} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar Producto' })
    );

    expect(
      await screen.findByText(INVENTORY_CONFIRMATION_MESSAGE)
    ).toBeVisible();
    expect(parentOnSubmit).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(parentOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('permite cancelar la confirmación sin enviar el formulario principal', async () => {
    const parentOnSubmit = vi.fn();

    render(<ProductHarness onSubmit={parentOnSubmit} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar Producto' })
    );

    expect(
      await screen.findByText(INVENTORY_CONFIRMATION_MESSAGE)
    ).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    await waitFor(() => {
      expect(
        screen.queryByText(INVENTORY_CONFIRMATION_MESSAGE)
      ).not.toBeInTheDocument();
    });
    expect(parentOnSubmit).not.toHaveBeenCalled();
  });
});
