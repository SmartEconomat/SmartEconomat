import { createContext } from 'react';
import { TutorialStep } from '../utils/config/tutorialData';

export interface TutorialContextType {
  isOpen: boolean;
  currentSteps: TutorialStep[];
  openTutorial: (path: string, role?: string) => void;
  closeTutorial: () => void;
}

export const TutorialContext = createContext<TutorialContextType | undefined>(
  undefined
);
