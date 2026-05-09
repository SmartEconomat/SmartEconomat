import { createContext } from 'react';
import { TutorialStep } from '../utils/config/tutorialData';

/** Contrato de tipos público (TutorialContextType). Contexto: smart-economat-frontend (SPA). */
export interface TutorialContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentSteps: TutorialStep[];
  startTour: (path: string, role?: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}

/** Constantes públicas (TutorialContext) expuestas en smart-economat-frontend (SPA). */
export const TutorialContext = createContext<TutorialContextType | undefined>(
  undefined
);
