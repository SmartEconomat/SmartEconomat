import React from 'react';
import { flushSync } from 'react-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

const currentRole = vi.hoisted(() => ({ value: 'ADMIN' }));
const slotsManagerState = vi.hoisted(() => ({
  props: null as null | Record<string, unknown>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../src/store/auth.hooks', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'user-admin-1',
      rol: currentRole.value,
      permisos: ['usuarios:listar', 'profesor:gestionar_slots'],
    },
  })),
  usePermission: vi.fn(() => true),
  useAnyPermission: vi.fn(() => true),
}));

vi.mock('../../src/store/toast.hooks', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  })),
}));

vi.mock('../../src/features/profile/components/ProfessorSlotsManager', () => ({
  default: (props: {
    slots: Array<unknown>;
    allSlots: Array<unknown>;
    onNewSlotChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onCreateSlot: (event: React.FormEvent) => Promise<void>;
  }) => {
    slotsManagerState.props = props;

    return (
      <div>
        <div data-testid="own-slots-count">{props.slots.length}</div>
        <div data-testid="all-slots-count">{props.allSlots.length}</div>
        <button
          type="button"
          onClick={() => {
            flushSync(() => {
              (slotsManagerState.props as typeof props).onNewSlotChange({
                target: { name: 'aula', value: 'Aula Admin' },
              } as React.ChangeEvent<HTMLInputElement>);
            });
            flushSync(() => {
              (slotsManagerState.props as typeof props).onNewSlotChange({
                target: { name: 'numeroClase', value: '2' },
              } as React.ChangeEvent<HTMLInputElement>);
            });
            flushSync(() => {
              (slotsManagerState.props as typeof props).onNewSlotChange({
                target: { name: 'capacidad', value: '28' },
              } as React.ChangeEvent<HTMLInputElement>);
            });
            void (slotsManagerState.props as typeof props).onCreateSlot({
              preventDefault: () => undefined,
            } as React.FormEvent);
          }}
        >
          create-self-slot
        </button>
      </div>
    );
  },
}));

vi.mock('../../src/features/profile/components/ProfessorStudentList', () => ({
  default: () => null,
}));

vi.mock('../../src/features/admin/components/PlantillasRolesView', () => ({
  default: () => null,
}));

vi.mock(
  '../../src/features/admin/components/ubicaciones-admin-manager',
  () => ({
    default: () => null,
  })
);

vi.mock('../../src/pages/Usuarios/UsuariosView', () => ({
  default: () => null,
}));

vi.mock('../../src/components/ui/Button', () => ({
  default: ({
    children,
    startIcon,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    startIcon?: React.ReactNode;
  }) => {
    void startIcon;
    return (
      <button type="button" {...props}>
        {children}
      </button>
    );
  },
}));

vi.mock('../../src/services/profesor.service', () => ({
  profesorService: {
    getSlots: vi.fn(),
    getAllSlots: vi.fn(),
    getAllProfesores: vi.fn(),
    adminCreateSlot: vi.fn(),
    createSlot: vi.fn(),
    getAlumnos: vi.fn(),
    activateAlumno: vi.fn(),
    forcePasswordReset: vi.fn(),
    removeStudent: vi.fn(),
    updateSlot: vi.fn(),
    adminUpdateSlot: vi.fn(),
    deleteSlot: vi.fn(),
    adminDeleteSlot: vi.fn(),
  },
}));

import Administracion from '../../src/pages/Administracion';
import { profesorService } from '../../src/services/profesor.service';

describe('Administracion academic slots for elevated roles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    slotsManagerState.props = null;
    currentRole.value = 'ADMIN';

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    vi.mocked(profesorService.getAllProfesores).mockResolvedValue({
      success: true,
      message: '',
      data: [
        {
          id: 'prof-1',
          userId: 'user-admin-1',
          username: 'admin-profesor',
        },
      ],
      status: 200,
    } as never);

    let selfSlotCreated = false;

    vi.mocked(profesorService.getAllSlots).mockImplementation(
      async () =>
        ({
          success: true,
          message: '',
          data: [
            {
              id: 'slot-admin-1',
              aula: 'Aula Inicial',
              numeroClase: 1,
              capacidad: 25,
              profesor: {
                id: 'prof-1',
                user: { id: 'user-admin-1', username: 'admin-profesor' },
              },
            },
            ...(selfSlotCreated
              ? [
                  {
                    id: 'slot-admin-2',
                    aula: 'Aula Admin',
                    numeroClase: 2,
                    capacidad: 28,
                    profesor: {
                      id: 'prof-1',
                      user: { id: 'user-admin-1', username: 'admin-profesor' },
                    },
                  },
                ]
              : []),
          ],
          status: 200,
        }) as never
    );

    vi.mocked(profesorService.getSlots).mockImplementation(
      async () =>
        ({
          success: true,
          message: '',
          data: [
            {
              id: 'slot-own-1',
              aula: 'Propia Inicial',
              numeroClase: 1,
              capacidad: 20,
            },
            ...(selfSlotCreated
              ? [
                  {
                    id: 'slot-admin-2',
                    aula: 'Aula Admin',
                    numeroClase: 2,
                    capacidad: 28,
                  },
                ]
              : []),
          ],
          status: 200,
        }) as never
    );

    vi.mocked(profesorService.adminCreateSlot).mockImplementation(async () => {
      selfSlotCreated = true;

      return {
        success: true,
        message: '',
        data: {
          id: 'slot-admin-2',
          aula: 'Aula Admin',
          numeroClase: 2,
          capacidad: 28,
          profesor: {
            id: 'prof-1',
            user: { id: 'user-admin-1', username: 'admin-profesor' },
          },
        },
        status: 201,
      } as never;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it.each(['ADMIN', 'SUPER_ADMIN'])(
    'refresca y asocia correctamente el alta propia para %s',
    async (role) => {
      currentRole.value = role;

      const { getByText } = render(
        <MemoryRouter initialEntries={['/administracion?tab=slots']}>
          <Administracion />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          (slotsManagerState.props?.allSlots as Array<unknown>)?.length
        ).toBe(1);
      });

      await waitFor(() => {
        expect((slotsManagerState.props?.slots as Array<unknown>)?.length).toBe(
          1
        );
      });

      fireEvent.click(getByText('create-self-slot'));

      await waitFor(() => {
        expect(profesorService.adminCreateSlot).toHaveBeenCalledWith({
          aula: 'Aula Admin',
          numeroClase: 2,
          capacidad: 28,
          profesorId: 'prof-1',
        });
      });

      await waitFor(() => {
        expect(profesorService.getAllSlots).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(
          (slotsManagerState.props?.allSlots as Array<unknown>)?.length
        ).toBe(2);
      });

      await waitFor(() => {
        expect((slotsManagerState.props?.slots as Array<unknown>)?.length).toBe(
          2
        );
      });
    }
  );
});
