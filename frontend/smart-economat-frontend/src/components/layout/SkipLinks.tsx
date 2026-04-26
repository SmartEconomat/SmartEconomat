import React from 'react';
import { navigateToElement } from '../../utils/a11y-navigation';

/**
 * Documentación en español.
 */
const SkipLinks: React.FC = () => {
  const handleSkip =
    (targetId: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      navigateToElement(targetId);
    };

  return (
    <div id="skip-links" style={{ pointerEvents: 'none' }}>
      <a
        style={{ pointerEvents: 'auto' }}
        href="#main-content"
        className="skip-link"
        onClick={handleSkip('main-content')}
      >
        Saltar al contenido principal
      </a>
      <a
        style={{ pointerEvents: 'auto' }}
        href="#sidebar-nav"
        className="skip-link"
        onClick={handleSkip('sidebar-nav')}
      >
        Saltar al menú lateral
      </a>
      <a
        style={{ pointerEvents: 'auto' }}
        href="#filters-area"
        className="skip-link"
        onClick={handleSkip('filters-area')}
      >
        Saltar a los filtros
      </a>
      <a
        style={{ pointerEvents: 'auto' }}
        href="#results-area"
        className="skip-link"
        onClick={handleSkip('results-area')}
      >
        Saltar a los resultados
      </a>
    </div>
  );
};

export default SkipLinks;
