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

export interface TutorialStep {
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
}

export interface TutorialConfigItem {
  steps?: TutorialStep[];
  roles?: Record<string, TutorialStep[]>;
}

export const tutorialConfig: Record<string, TutorialConfigItem> = {
  '/': {
    steps: [
      {
        icon: <DashboardIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        titleKey: 'tutorial.home.panel.title',
        descriptionKey: 'tutorial.home.panel.description',
      },
      {
        icon: (
          <AddShoppingCartIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
        ),
        titleKey: 'tutorial.home.accesos.title',
        descriptionKey: 'tutorial.home.accesos.description',
      },
      {
        icon: <AssessmentIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        titleKey: 'tutorial.home.resumen.title',
        descriptionKey: 'tutorial.home.resumen.description',
      },
    ],
  },
  '/recepciones': {
    steps: [
      {
        icon: (
          <QrCodeScannerIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        ),
        titleKey: 'tutorial.recepciones.gestion.title',
        descriptionKey: 'tutorial.recepciones.gestion.description',
      },
      {
        icon: (
          <QrCodeScannerIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
        ),
        titleKey: 'tutorial.recepciones.escaneo.title',
        descriptionKey: 'tutorial.recepciones.escaneo.description',
      },
    ],
  },
  '/inventario': {
    steps: [
      {
        icon: <InventoryIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        titleKey: 'tutorial.inventario.gestion.title',
        descriptionKey: 'tutorial.inventario.gestion.description',
      },
      {
        icon: <AssessmentIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        titleKey: 'tutorial.inventario.ajustes.title',
        descriptionKey: 'tutorial.inventario.ajustes.description',
      },
    ],
  },
  '/perfil': {
    roles: {
      PROFESOR: [
        {
          icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          titleKey: 'tutorial.perfil.usuario.title',
          descriptionKey: 'tutorial.perfil.usuario.description',
        },
        {
          icon: <LockIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
          titleKey: 'tutorial.perfil.seguridad.title',
          descriptionKey: 'tutorial.perfil.seguridad.description',
        },
        {
          icon: (
            <MeetingRoomIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
          ),
          titleKey: 'tutorial.perfil.aulas.title',
          descriptionKey: 'tutorial.perfil.aulas.description',
        },
        {
          icon: <GroupIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          titleKey: 'tutorial.perfil.alumnos.title',
          descriptionKey: 'tutorial.perfil.alumnos.description',
        },
      ],
      ALUMNO: [
        {
          icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          titleKey: 'tutorial.perfil.usuario_alumno.title',
          descriptionKey: 'tutorial.perfil.usuario_alumno.description',
        },
        {
          icon: <LockIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
          titleKey: 'tutorial.perfil.seguridad_alumno.title',
          descriptionKey: 'tutorial.perfil.seguridad_alumno.description',
        },
        {
          icon: <EmailIcon sx={{ fontSize: 60, color: 'info.main' }} />,
          titleKey: 'tutorial.perfil.email.title',
          descriptionKey: 'tutorial.perfil.email.description',
        },
      ],
    },
  },
  default: {
    steps: [
      {
        icon: <HelpIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        titleKey: 'tutorial.default.ayuda.title',
        descriptionKey: 'tutorial.default.ayuda.description',
      },
      {
        icon: <SettingsIcon sx={{ fontSize: 60, color: 'action.active' }} />,
        titleKey: 'tutorial.default.config.title',
        descriptionKey: 'tutorial.default.config.description',
      },
    ],
  },
};
