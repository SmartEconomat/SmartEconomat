import { useContext } from 'react';
import { TutorialContext } from './tutorial.context';

/**
 * Expone "useTutorial" en smart-economat-frontend (SPA).
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/store/tutorial.context").TutorialContextType} Datos efectivos después de ejecutar la operación.
 */
export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
