import React, { useState } from 'react';
import { tutorialConfig, TutorialStep } from './tutorialData';
import { TutorialContext } from '../../store/tutorial.context';

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<TutorialStep[]>([]);

  const openTutorial = (path: string, role?: string) => {
    const config = tutorialConfig[path] || tutorialConfig.default;
    let steps: TutorialStep[] = [];
    if (config.roles && role) {
      steps = config.roles[role] || [];
    } else {
      steps = config.steps || [];
    }
    setCurrentSteps(steps);
    setIsOpen(true);
  };

  const closeTutorial = () => setIsOpen(false);

  return (
    <TutorialContext.Provider
      value={{ isOpen, currentSteps, openTutorial, closeTutorial }}
    >
      {children}
    </TutorialContext.Provider>
  );
};
