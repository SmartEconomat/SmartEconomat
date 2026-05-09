import React, { useState, useCallback, ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  buildTutorialConfig,
  TutorialStep,
} from '../utils/config/tutorialData';
import i18n from '../i18n/index';
import { TutorialContext } from './tutorial.context';
import { useAuth } from './auth.hooks';
import { usuarioService } from '../services/usuarioService';
import {
  isBooleanTrue,
  isTutorialGloballyCompleted,
  TUTORIAL_COMPLETED_PREFERENCE_KEY,
  TUTORIAL_COMPLETED_STORAGE_KEY,
} from './tutorial.persistence';

/**
 * Expone "TutorialProvider" en smart-economat-frontend (SPA).
 * @undefined {{ children: ReactNode; }} {
 *   children,
 * } - Entrada efectiva esperada por el contrato.
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/jsx-runtime").JSX.Element} Datos efectivos después de ejecutar la operación.
 */
export const TutorialProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentSteps, setCurrentSteps] = useState<TutorialStep[]>([]);

  const userRole = user?.rol?.toUpperCase() || '';

  const startTour = useCallback(
    (path: string, role?: string) => {
      const tutorialConfig = buildTutorialConfig(i18n.t);
      const config = tutorialConfig[path] || tutorialConfig['default'];
      const roleToUse = role || userRole;

      let steps: TutorialStep[] = [];
      if (config.roles && config.roles[roleToUse]) {
        steps = config.roles[roleToUse];
      } else {
        steps = config.steps || [];
      }

      if (steps.length > 0) {
        setCurrentSteps(steps);
        setCurrentStepIndex(0);
        setIsActive(true);
      }
    },
    [userRole]
  );

  const setTourSeen = useCallback(
    async (path: string) => {
      if (!user) return;

      const pathKey = `has_seen_tour_${path.replace(/\//g, '_')}`;
      const currentPreferences =
        (user.preferences as Record<string, unknown> | undefined) || {};
      const alreadyCompleted =
        isTutorialGloballyCompleted(currentPreferences) ||
        isBooleanTrue(localStorage.getItem(TUTORIAL_COMPLETED_STORAGE_KEY));

      if (alreadyCompleted) {
        return;
      }

      const optimisticPreferences = {
        ...currentPreferences,
        [pathKey]: true,
        [TUTORIAL_COMPLETED_PREFERENCE_KEY]: true,
      };

      localStorage.setItem(TUTORIAL_COMPLETED_STORAGE_KEY, 'true');
      updateUser({ preferences: optimisticPreferences });

      try {
        const response = await usuarioService.updatePreferences({
          [pathKey]: true,
          [TUTORIAL_COMPLETED_PREFERENCE_KEY]: true,
        });
        if (response.data) {
          updateUser({ preferences: response.data.preferences });
        }
      } catch (error) {
        console.error('Error updating tutorial preferences:', error);
      }
    },
    [user, updateUser]
  );

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
    if (!user) return;

    const currentPath = location.pathname;
    const currentPreferences =
      (user.preferences as Record<string, unknown> | undefined) || {};
    const hasCompletedTutorial =
      isTutorialGloballyCompleted(currentPreferences) ||
      isBooleanTrue(localStorage.getItem(TUTORIAL_COMPLETED_STORAGE_KEY));

    if (!hasCompletedTutorial) {
      // Pequeño delay para asegurar que la página ha cargado y los elementos están en el DOM
      const timer = setTimeout(() => {
        startTour(currentPath);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, startTour, user]);

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
