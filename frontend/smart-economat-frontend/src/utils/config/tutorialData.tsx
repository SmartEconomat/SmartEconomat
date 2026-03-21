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
  title: string;
  description: string;
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
        title: 'Panel de Inicio',
        description:
          'Este es tu centro de control principal. Aquí tendrás una vista rápida del estado de tu economato.',
      },
      {
        icon: (
          <AddShoppingCartIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
        ),
        title: 'Accesos Rápidos',
        description:
          'Usa las tarjetas de acceso rápido para crear nuevos pedidos o registrar artículos en segundos.',
      },
      {
        icon: <AssessmentIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Resumen de Actividad',
        description:
          'Mantente al día con las últimas notificaciones y alertas de stock bajo.',
      },
    ],
  },
  '/recepciones': {
    steps: [
      {
        icon: (
          <QrCodeScannerIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        ),
        title: 'Recepción de Mercancía',
        description:
          'Gestiona la entrada de productos al almacén de manera eficiente.',
      },
      {
        icon: (
          <QrCodeScannerIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
        ),
        title: 'Escaneo de Códigos',
        description:
          'Usa el lector de códigos de barras para identificar productos rápidamente y evitar errores.',
      },
    ],
  },
  '/inventario': {
    steps: [
      {
        icon: <InventoryIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Gestión de Inventario',
        description:
          'Consulta el stock actual de todos tus productos en tiempo real.',
      },
      {
        icon: <AssessmentIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: 'Ajustes y Filtros',
        description:
          'Realiza ajustes manuales y filtra por categorías para encontrar lo que buscas.',
      },
    ],
  },
  '/perfil': {
    roles: {
      PROFESOR: [
        {
          icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          title: 'Perfil de usuario',
          description:
            'Desde esta tarjeta puedes revisar y editar tus datos personales básicos.',
        },
        {
          icon: <LockIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
          title: 'Seguridad y contraseña',
          description:
            'Puedes cambiar tu nombre de usuario y contraseña. El cambio de email requiere autorización de un rol superior.',
        },
        {
          icon: (
            <MeetingRoomIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
          ),
          title: 'Administración de aulas',
          description:
            'Como profesor puedes gestionar clases, cupos y ubicaciones académicas.',
        },
        {
          icon: <GroupIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          title: 'Gestión de alumnos',
          description:
            'Puedes consultar alumnos, activar su estado y realizar acciones docentes permitidas.',
        },
      ],
      ALUMNO: [
        {
          icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          title: 'Perfil de usuario',
          description: 'Aquí puedes consultar tu información personal.',
        },
        {
          icon: <LockIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
          title: 'Seguridad y contraseña',
          description:
            'Como alumno puedes editar tu nombre de usuario y cambiar tu contraseña.',
        },
        {
          icon: <EmailIcon sx={{ fontSize: 60, color: 'info.main' }} />,
          title: 'Cambio de email',
          description:
            'El email no se modifica directamente. Debes enviar una solicitud y esperar la aprobación de un rol superior.',
        },
      ],
    },
  },
  default: {
    steps: [
      {
        icon: <HelpIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Ayuda General',
        description:
          'Navega por el menú lateral para acceder a las diferentes secciones de la aplicación.',
      },
      {
        icon: <SettingsIcon sx={{ fontSize: 60, color: 'action.active' }} />,
        title: 'Configuración',
        description:
          'Personaliza tu experiencia, cambia el tema o gestiona tu perfil desde el menú superior.',
      },
    ],
  },
};
