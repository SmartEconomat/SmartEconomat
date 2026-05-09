import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import MuiDialog, {
  type DialogProps as MuiDialogProps,
} from '@mui/material/Dialog';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
let openDialogCount = 0;

/**
 * Ejecuta la lógica de set element inert dentro del flujo de la aplicación.
 *
 * @param element Parámetro de entrada para la operación.
 * @param shouldBeInert Parámetro de entrada para la operación.
 */
function setElementInert(element: HTMLElement, shouldBeInert: boolean): void {
  const target = element as HTMLElement & { inert?: boolean };

  if (typeof target.inert === 'boolean') {
    target.inert = shouldBeInert;
    return;
  }

  if (shouldBeInert) {
    element.setAttribute('inert', '');
  } else {
    element.removeAttribute('inert');
  }
}

/**
 * Determina si element inert.
 *
 * @param element Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
function isElementInert(element: HTMLElement): boolean {
  const target = element as HTMLElement & { inert?: boolean };
  return Boolean(target.inert) || element.hasAttribute('inert');
}

/**
 * Ejecuta la lógica de sync application inert state dentro del flujo de la aplicación.
 */
function syncApplicationInertState(): void {
  const appRoot = document.getElementById('root');

  if (!appRoot) {
    return;
  }

  const shouldInert = openDialogCount > 0;
  setElementInert(appRoot, shouldInert);

  if (shouldInert) {
    appRoot.setAttribute('data-overlay-inert', 'true');
  } else {
    appRoot.removeAttribute('data-overlay-inert');
  }
}

/**
 * Ejecuta la lógica de sync dialog stack inert state dentro del flujo de la aplicación.
 */
function syncDialogStackInertState(): void {
  const dialogPapers = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-accessible-dialog-paper="true"]'
    )
  ).filter((paper) => {
    const modalRoot = paper.closest<HTMLElement>('.MuiModal-root');
    return (
      Boolean(modalRoot) && modalRoot?.getAttribute('aria-hidden') !== 'true'
    );
  });

  const topPaper = dialogPapers.at(-1) ?? null;

  dialogPapers.forEach((paper) => {
    setElementInert(paper, paper !== topPaper);
  });
}

/**
 * Ejecuta la lógica de restore focus dentro del flujo de la aplicación.
 *
 * @param element Parámetro de entrada para la operación.
 */
function restoreFocus(element: HTMLElement | null): void {
  if (!element || !element.isConnected) {
    return;
  }

  const appRoot = document.getElementById('root');
  const blockedByInertRoot =
    appRoot instanceof HTMLElement &&
    appRoot.contains(element) &&
    isElementInert(appRoot);

  if (blockedByInertRoot) {
    return;
  }

  element.focus({ preventScroll: true });
}

/**
 * Obtiene initial focus target.
 *
 * @param dialogPaper Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
function getInitialFocusTarget(dialogPaper: HTMLElement): HTMLElement {
  const preferred = dialogPaper.querySelector<HTMLElement>(
    '[data-dialog-initial-focus="true"], [autofocus]'
  );

  if (preferred) {
    return preferred;
  }

  const firstFocusable =
    dialogPaper.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);

  if (firstFocusable) {
    return firstFocusable;
  }

  return dialogPaper;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "AccessibleDialog" en smart-economat-frontend (SPA).
 * @undefined {MuiDialogProps} {
 *   open,
 *   PaperProps,
 *   disableRestoreFocus,
 *   ...restProps
 * } - Entrada efectiva esperada por el contrato.
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/jsx-runtime").JSX.Element} Datos efectivos después de ejecutar la operación.
 */
export default function AccessibleDialog({
  open,
  PaperProps,
  disableRestoreFocus,
  ...restProps
}: MuiDialogProps) {
  const paperRef = useRef<HTMLDivElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef<boolean>(Boolean(open));

  const setPaperRef = useCallback(
    (node: HTMLDivElement | null) => {
      paperRef.current = node;

      if (!PaperProps?.ref) {
        return;
      }

      if (typeof PaperProps.ref === 'function') {
        PaperProps.ref(node);
        return;
      }

      PaperProps.ref.current = node;
    },
    [PaperProps]
  );

  const mergedPaperProps = useMemo<MuiDialogProps['PaperProps']>(
    () => ({
      ...PaperProps,
      tabIndex: PaperProps?.tabIndex ?? -1,
      'data-accessible-dialog-paper': 'true',
      ref: setPaperRef,
    }),
    [PaperProps, setPaperRef]
  );

  useLayoutEffect(() => {
    const wasOpen = wasOpenRef.current;

    if (open && !wasOpen) {
      const activeElement = document.activeElement;

      if (activeElement instanceof HTMLElement) {
        previousFocusedElementRef.current = activeElement;
        activeElement.blur();
      } else {
        previousFocusedElementRef.current = null;
      }

      openDialogCount += 1;
      syncApplicationInertState();
    }

    if (!open && wasOpen) {
      openDialogCount = Math.max(0, openDialogCount - 1);
      syncApplicationInertState();

      const previousElement = previousFocusedElementRef.current;
      window.setTimeout(() => restoreFocus(previousElement), 0);
    }

    wasOpenRef.current = open;
    window.setTimeout(syncDialogStackInertState, 0);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const rafId = window.requestAnimationFrame(() => {
      const dialogPaper = paperRef.current;

      if (!dialogPaper) {
        return;
      }

      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement &&
        dialogPaper.contains(activeElement)
      ) {
        return;
      }

      getInitialFocusTarget(dialogPaper).focus({ preventScroll: true });
      syncDialogStackInertState();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (wasOpenRef.current) {
        openDialogCount = Math.max(0, openDialogCount - 1);
        syncApplicationInertState();
      }

      syncDialogStackInertState();
    };
  }, []);

  return (
    <MuiDialog
      open={open}
      disableRestoreFocus={disableRestoreFocus ?? true}
      PaperProps={mergedPaperProps}
      {...restProps}
    />
  );
}
