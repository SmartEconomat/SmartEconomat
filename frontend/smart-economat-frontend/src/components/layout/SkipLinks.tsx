import React from 'react';
import { navigateToElement } from '../../utils/a11y-navigation';

/**
 * SkipLinks: Enlaces de salto para accesibilidad (WCAG 2.4.1).
 * Estos enlaces permiten a los usuarios de teclado saltar directamente 
 * a las secciones principales evitando la repetición de elementos.
 * 
 * Implementación con gestión de foco manual para máxima fiabilidad en SPAs.
 */
const SkipLinks: React.FC = () => {
  const handleSkip = (targetId: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigateToElement(targetId);
  };

  return (
    <div id="skip-links">
      <a 
        href="#main-content" 
        className="skip-link" 
        onClick={handleSkip('main-content')}
      >
        Saltar al contenido principal
      </a>
      <a 
        href="#sidebar-nav" 
        className="skip-link" 
        onClick={handleSkip('sidebar-nav')}
      >
        Saltar al menú lateral
      </a>
      <a 
        href="#filters-area" 
        className="skip-link" 
        onClick={handleSkip('filters-area')}
      >
        Saltar a los filtros
      </a>
      <a 
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
