import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
} from '@mui/material';
import { useState } from 'react';
import AccessibleDialog from '../../../src/components/ui/AccessibleDialog';

function createRootContainer(): HTMLElement {
  document.body.innerHTML = '';
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
  return root;
}

function BasicDialogHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button disableRipple onClick={() => setOpen(true)}>
        Abrir dialogo
      </Button>
      <AccessibleDialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Titulo de prueba</DialogTitle>
        <DialogContent>
          <button type="button" data-dialog-initial-focus="true">
            Foco inicial
          </button>
        </DialogContent>
        <DialogActions>
          <Button disableRipple onClick={() => setOpen(false)}>
            Cerrar dialogo
          </Button>
        </DialogActions>
      </AccessibleDialog>
    </>
  );
}

function NestedDialogHarness() {
  const [parentOpen, setParentOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);

  return (
    <>
      <Button disableRipple onClick={() => setParentOpen(true)}>
        Abrir padre
      </Button>

      <AccessibleDialog open={parentOpen} onClose={() => setParentOpen(false)}>
        <DialogTitle>Dialogo padre</DialogTitle>
        <DialogContent>
          <Button disableRipple onClick={() => setChildOpen(true)}>
            Abrir hijo
          </Button>
          <Button disableRipple onClick={() => setParentOpen(false)}>
            Cerrar padre
          </Button>
        </DialogContent>
      </AccessibleDialog>

      <AccessibleDialog open={childOpen} onClose={() => setChildOpen(false)}>
        <DialogTitle>Dialogo hijo</DialogTitle>
        <DialogContent>
          <Button disableRipple onClick={() => setChildOpen(false)}>
            Cerrar hijo
          </Button>
        </DialogContent>
      </AccessibleDialog>
    </>
  );
}

describe('AccessibleDialog', () => {
  beforeEach(() => {
    createRootContainer();
  });

  it('aplica inert al root cuando hay dialogs abiertos y lo limpia al cerrar', async () => {
    const root = document.getElementById('root') as HTMLElement;
    render(<BasicDialogHarness />, { container: root });

    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir dialogo' })
    );

    await waitFor(() => {
      expect(root.hasAttribute('data-overlay-inert')).toBe(true);
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Cerrar dialogo' })
    );

    await waitFor(() => {
      expect(root.hasAttribute('data-overlay-inert')).toBe(false);
    });
  });

  it('enfoca el objetivo inicial del dialogo y restaura foco al cerrar', async () => {
    const root = document.getElementById('root') as HTMLElement;
    render(<BasicDialogHarness />, { container: root });

    const openButton = screen.getByRole('button', { name: 'Abrir dialogo' });
    openButton.focus();

    await userEvent.click(openButton);

    const initialFocusTarget = await screen.findByRole('button', {
      name: 'Foco inicial',
    });

    await waitFor(() => {
      expect(initialFocusTarget).toHaveFocus();
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Cerrar dialogo' })
    );

    await waitFor(() => {
      expect(openButton).toHaveFocus();
    });
  });

  it('mantiene el contexto del dialogo padre al cerrar un hijo anidado', async () => {
    const root = document.getElementById('root') as HTMLElement;
    render(<NestedDialogHarness />, { container: root });

    await userEvent.click(screen.getByRole('button', { name: 'Abrir padre' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Abrir hijo' })
    );

    await waitFor(() => {
      expect(root.hasAttribute('data-overlay-inert')).toBe(true);
      expect(screen.getByRole('button', { name: 'Cerrar hijo' })).toBeDefined();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar hijo' }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Cerrar padre' })
      ).toBeDefined();
      expect(root.hasAttribute('data-overlay-inert')).toBe(true);
    });
  });
});
