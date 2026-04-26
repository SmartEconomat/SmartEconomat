import React, { useState, useCallback, ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTutorialConfig, TutorialStep } from '../utils/config/tutorialData';
import { TutorialContext } from './tutorial.context';
import { useAuth } from './auth.hooks';

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentSteps, setCurrentSteps] = useState<TutorialStep[]>([]);

  const userRole = user?.rol?.toUpperCase() || '';

  // When language changes, re-generate current steps so titles/descriptions update
  useEffect(() => {
    if (isActive && currentSteps.length > 0) {
      const config = getTutorialConfig(t);
      const currentPath = location.pathname;
      const pageConfig = config[currentPath] || config['default'];
      const roleToUse = userRole;

      let steps: TutorialStep[] = [];
      if (pageConfig.roles && pageConfig.roles[roleToUse]) {
        steps = pageConfig.roles[roleToUse];
      } else {
        steps = pageConfig.steps || [];
      }

      if (steps.length > 0) {
        setCurrentSteps(steps);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]); // Only re-run when t changes (i.e. language changes)

  const startTour = useCallback(
    (path: string, role?: string) => {
      const config = getTutorialConfig(t);
      const pageConfig = config[path] || config['default'];
      const roleToUse = role || userRole;

      let steps: TutorialStep[] = [];
      if (pageConfig.roles && pageConfig.roles[roleToUse]) {
        steps = pageConfig.roles[roleToUse];
      } else {
        steps = pageConfig.steps || [];
      }

      if (steps.length > 0) {
        setCurrentSteps(steps);
        setCurrentStepIndex(0);
        setIsActive(true);
      }
    },
    [userRole, t]
  );

  const setTourSeen = useCallback((path: string) => {
    localStorage.setItem(`has_seen_tour_${path}`, 'true');
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev < currentSteps.length - 1) {
        return prev + 1;
      }
      setIsActive(false);
      setTourSeen(location.pathname);
      return prev;
    });
  }, [currentSteps.length, location.pathname, setTourSeen]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setTourSeen(location.pathname);
  }, [location.pathname, setTourSeen]);

  // Auto-lanzamiento
  useEffect(() => {
    const currentPath = location.pathname;
    const hasSeen = localStorage.getItem(`has_seen_tour_${currentPath}`);

    if (!hasSeen) {
      // Pequeño delay para asegurar que la página ha cargado y los elementos están en el DOM
      const timer = setTimeout(() => {
        startTour(currentPath);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, startTour]);

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentSteps,
        startTour,
        nextStep,
        prevStep,
        skipTour,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};
