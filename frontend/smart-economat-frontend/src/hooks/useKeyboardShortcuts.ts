import { useEffect } from 'react';
import { navigateToElement } from '../utils/a11y-navigation';
import { useToast } from '../store/toast.hooks';

/**
 * Documentación en español.
 */
export const useKeyboardShortcuts = () => {
  const toast = useToast();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Solo actuar si no hay modificadores (presión limpia de F-key)
      if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey)
        return;

      switch (event.key) {
        case 'F1':
          event.preventDefault();
          if (navigateToElement('main-content')) {
            toast.info('Navegando al contenido principal (F1)', 2000, {
              iconType: 'navigation',
            });
          }
          break;
        case 'F2':
          event.preventDefault();
          if (navigateToElement('sidebar-nav')) {
            toast.info('Navegando al menú lateral (F2)', 2000, {
              iconType: 'navigation',
            });
          }
          break;
        case 'F3':
          event.preventDefault();
          if (navigateToElement('filters-area')) {
            toast.info('Navegando a la zona de filtros (F3)', 2000, {
              iconType: 'navigation',
            });
          }
          break;
        case 'F4':
          event.preventDefault();
          if (navigateToElement('results-area')) {
            toast.info('Navegando a los resultados (F4)', 2000, {
              iconType: 'navigation',
            });
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toast]);
};
