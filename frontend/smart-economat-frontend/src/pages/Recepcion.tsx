import React from 'react';
import RecepcionWizard from '../components/recepcion/RecepcionWizard';

/**
 * Página de Recepción de Mercancía.
 * Delegamos toda la lógica compleja al componente RecepcionWizard
 * para permitir su reutilización en el Dashboard como modal.
 */
const Recepcion: React.FC = () => {
  return (
    <RecepcionWizard />
  );
};

export default Recepcion;
