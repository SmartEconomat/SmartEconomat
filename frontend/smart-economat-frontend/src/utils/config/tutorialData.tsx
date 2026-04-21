import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import InventoryIcon from '@mui/icons-material/Inventory';
import HelpIcon from '@mui/icons-material/Help';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GroupIcon from '@mui/icons-material/Group';
import EmailIcon from '@mui/icons-material/Email';
import SettingsIcon from '@mui/icons-material/Settings';
import type { TFunction } from 'i18next';

export interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface TutorialConfigItem {
  steps?: TutorialStep[];
  roles?: Record<string, TutorialStep[]>;
}

export function getTutorialConfig(
  t: TFunction
): Record<string, TutorialConfigItem> {
  return {
    '/': {
      steps: [
        {
          icon: <DashboardIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          title: t('tutorial.home.step1Title'),
          description: t('tutorial.home.step1Desc'),
        },
        {
          icon: (
            <AddShoppingCartIcon
              sx={{ fontSize: 60, color: 'secondary.main' }}
            />
          ),
          title: t('tutorial.home.step2Title'),
          description: t('tutorial.home.step2Desc'),
        },
        {
          icon: <AssessmentIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          title: t('tutorial.home.step3Title'),
          description: t('tutorial.home.step3Desc'),
        },
      ],
    },
    '/recepciones': {
      steps: [
        {
          icon: (
            <QrCodeScannerIcon sx={{ fontSize: 60, color: 'primary.main' }} />
          ),
          title: t('tutorial.recepciones.step1Title'),
          description: t('tutorial.recepciones.step1Desc'),
        },
        {
          icon: (
            <QrCodeScannerIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
          ),
          title: t('tutorial.recepciones.step2Title'),
          description: t('tutorial.recepciones.step2Desc'),
        },
      ],
    },
    '/inventario': {
      steps: [
        {
          icon: <InventoryIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          title: t('tutorial.inventario.step1Title'),
          description: t('tutorial.inventario.step1Desc'),
        },
        {
          icon: <AssessmentIcon sx={{ fontSize: 60, color: 'info.main' }} />,
          title: t('tutorial.inventario.step2Title'),
          description: t('tutorial.inventario.step2Desc'),
        },
      ],
    },
    '/perfil': {
      roles: {
        PROFESOR: [
          {
            icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
            title: t('tutorial.perfilProfesor.step1Title'),
            description: t('tutorial.perfilProfesor.step1Desc'),
          },
          {
            icon: <LockIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
            title: t('tutorial.perfilProfesor.step2Title'),
            description: t('tutorial.perfilProfesor.step2Desc'),
          },
          {
            icon: (
              <MeetingRoomIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
            ),
            title: t('tutorial.perfilProfesor.step3Title'),
            description: t('tutorial.perfilProfesor.step3Desc'),
          },
          {
            icon: <GroupIcon sx={{ fontSize: 60, color: 'success.main' }} />,
            title: t('tutorial.perfilProfesor.step4Title'),
            description: t('tutorial.perfilProfesor.step4Desc'),
          },
        ],
        ALUMNO: [
          {
            icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
            title: t('tutorial.perfilAlumno.step1Title'),
            description: t('tutorial.perfilAlumno.step1Desc'),
          },
          {
            icon: <LockIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
            title: t('tutorial.perfilAlumno.step2Title'),
            description: t('tutorial.perfilAlumno.step2Desc'),
          },
          {
            icon: <EmailIcon sx={{ fontSize: 60, color: 'info.main' }} />,
            title: t('tutorial.perfilAlumno.step3Title'),
            description: t('tutorial.perfilAlumno.step3Desc'),
          },
        ],
      },
    },
    default: {
      steps: [
        {
          icon: <HelpIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          title: t('tutorial.default.step1Title'),
          description: t('tutorial.default.step1Desc'),
        },
        {
          icon: <SettingsIcon sx={{ fontSize: 60, color: 'action.active' }} />,
          title: t('tutorial.default.step2Title'),
          description: t('tutorial.default.step2Desc'),
        },
      ],
    },
  };
}

// Keep a backward-compatible export for any remaining static usages
export const tutorialConfig = getTutorialConfig(
  ((key: string) => key) as unknown as TFunction
);
