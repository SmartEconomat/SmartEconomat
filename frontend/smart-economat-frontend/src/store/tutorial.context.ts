import { createContext } from 'react';
import { TutorialStep } from '../utils/config/tutorialData';

export interface TutorialContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentSteps: TutorialStep[];
  startTour: (path: string, role?: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}

export const TutorialContext = createContext<TutorialContextType | undefined>(
  undefined
);
