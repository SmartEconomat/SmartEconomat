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

/** CSS selector string targeting all focusable elements within a container. */
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

/** Tracks how many accessible dialogs are currently open. */
let openDialogCount = 0;

/**
 * Sets or removes the `inert` attribute/property on a DOM element.
 * Supports both the native boolean property and the string attribute fallback.
 *
 * @param element - The HTML element to modify.
 * @param shouldBeInert - Whether the element should be inert.
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
 * Returns whether a DOM element is currently inert.
 *
 * @param element - The element to check.
 * @returns `true` if the element is inert.
 */
function isElementInert(element: HTMLElement): boolean {
  const target = element as HTMLElement & { inert?: boolean };
  return Boolean(target.inert) || element.hasAttribute('inert');
}

/**
 * Synchronises the `inert` state of the application root element
 * based on whether any accessible dialogs are currently open.
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
 * Synchronises the `inert` state of all open accessible dialog papers
 * so that only the topmost dialog is interactive.
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
 * Restores keyboard focus to a previously focused element, guarding
 * against cases where the element has been removed from the DOM or
 * is blocked by an inert application root.
 *
 * @param element - The element to focus, or `null` to skip.
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
 * Determines which element inside a dialog paper should receive initial focus.
 * Prefers `[data-dialog-initial-focus]` or `[autofocus]` attributes, then
 * the first focusable element, and finally the paper itself.
 *
 * @param dialogPaper - The dialog's paper element.
 * @returns The element that should receive initial focus.
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
 * Accessible replacement for `MuiDialog` that correctly manages focus trapping,
 * focus restoration, and `inert` attributes for stacked dialogs.
 *
 * Drop-in replacement: accepts all standard `MuiDialogProps`.
 *
 * @param props - MUI Dialog props forwarded to the underlying Dialog.
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
