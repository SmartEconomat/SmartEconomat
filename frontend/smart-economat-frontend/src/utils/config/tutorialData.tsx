import React from 'react';
import type { TFunction } from 'i18next';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import InventoryIcon from '@mui/icons-material/Inventory';
import HelpIcon from '@mui/icons-material/Help';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import HistoryIcon from '@mui/icons-material/History';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import BalanceIcon from '@mui/icons-material/Balance';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import RuleIcon from '@mui/icons-material/Rule';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import HomeWorkIcon from '@mui/icons-material/HomeWorkOutlined';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TuneIcon from '@mui/icons-material/Tune';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SchoolIcon from '@mui/icons-material/SchoolOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import EditIcon from '@mui/icons-material/Edit';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';

export interface TutorialStep {
  /**
   * Documentación en español.
   */
  target?: string;
  /**
   * Documentación en español.
   */
  placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'center';
  /**
   * Documentación en español.
   */
  disableFlip?: boolean;
  /**
   * Documentación en español.
   */
  icon: React.ReactNode;
  /**
   * Documentación en español.
   */
  title: string;
  /**
   * Documentación en español.
   */
  description: string;
}

export interface TutorialConfigItem {
  steps?: TutorialStep[];
  roles?: Record<string, TutorialStep[]>;
}

function tu(
  t: TFunction,
  group: string,
  index: number
): Pick<TutorialStep, 'title' | 'description'> {
  const p = `tutorial.routes.${group}.s${index}`;
  return {
    title: t(`${p}.title`),
    description: t(`${p}.description`),
  };
}

function tuHelp(t: TFunction): Pick<TutorialStep, 'title' | 'description'> {
  return {
    title: t('tutorial.routes.common.help.title'),
    description: t('tutorial.routes.common.help.description'),
  };
}

export function buildTutorialConfig(
  t: TFunction
): Record<string, TutorialConfigItem> {
  const helpTutorialStep: TutorialStep = {
    target: '#help-tutorial-button',
    placement: 'right',
    icon: <HelpOutlineIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
    ...tuHelp(t),
  };

  return {
    '/': {
      steps: [
        {
          target: '#dashboard-welcome',
          placement: 'bottom',
          icon: <DashboardIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'root', 0),
        },
        {
          target: '#sidebar-nav',
          placement: 'right',
          icon: <MenuIcon sx={{ fontSize: 60, color: 'info.main' }} />,
          ...tu(t, 'root', 1),
        },
        {
          target: '#dashboard-stats',
          placement: 'center',
          icon: <TrendingUpIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          ...tu(t, 'root', 2),
        },
        {
          target: '#dashboard-quick-actions',
          placement: 'center',
          icon: <TouchAppIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
          ...tu(t, 'root', 3),
        },
        {
          target: '#btn-notifications',
          placement: 'bottom',
          icon: (
            <NotificationsIcon sx={{ fontSize: 60, color: 'error.main' }} />
          ),
          ...tu(t, 'root', 4),
        },
        {
          target: '#dashboard-activity',
          placement: 'left',
          icon: <HistoryIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
          ...tu(t, 'root', 5),
        },
        {
          target: '#user-menu-button',
          placement: 'bottom',
          icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'root', 6),
        },
        helpTutorialStep,
      ],
    },
    '/productos': {
      steps: [
        {
          target: '#search-productos',
          placement: 'bottom',
          icon: <SearchIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'productos', 0),
        },
        {
          target: '#filter-productos',
          placement: 'bottom',
          icon: <FilterListIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'productos', 1),
        },
        {
          target: '#table-header-sort',
          placement: 'bottom',
          icon: (
            <SortByAlphaIcon sx={{ fontSize: 60, color: 'primary.main' }} />
          ),
          ...tu(t, 'productos', 2),
        },
        {
          target: '#btn-nuevo-producto',
          placement: 'bottom',
          icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          ...tu(t, 'productos', 3),
        },
        {
          target: '#btn-exportar-productos-pdf',
          placement: 'bottom',
          icon: (
            <PictureAsPdfOutlinedIcon
              sx={{ fontSize: 60, color: 'error.main' }}
            />
          ),
          ...tu(t, 'productos', 4),
        },
        {
          target: '#btn-exportar-productos-excel',
          placement: 'bottom',
          icon: (
            <FileDownloadOutlinedIcon
              sx={{ fontSize: 60, color: 'success.main' }}
            />
          ),
          ...tu(t, 'productos', 5),
        },
        {
          target: '#table-row-actions',
          placement: 'left',
          icon: <TouchAppIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
          ...tu(t, 'productos', 6),
        },
        helpTutorialStep,
      ],
    },
    '/proveedores': {
      steps: [
        {
          target: '#search-proveedores',
          placement: 'bottom',
          icon: <SearchIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'proveedores', 0),
        },
        {
          target: '#table-header-sort',
          placement: 'bottom',
          icon: (
            <SortByAlphaIcon sx={{ fontSize: 60, color: 'primary.main' }} />
          ),
          ...tu(t, 'proveedores', 1),
        },
        {
          target: '#btn-nuevo-proveedor',
          placement: 'bottom',
          icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          ...tu(t, 'proveedores', 2),
        },
        {
          target: '#btn-export-pdf',
          placement: 'bottom',
          icon: (
            <PictureAsPdfOutlinedIcon
              sx={{ fontSize: 60, color: 'error.main' }}
            />
          ),
          ...tu(t, 'proveedores', 3),
        },
        {
          target: '#btn-export-excel',
          placement: 'bottom',
          icon: (
            <FileDownloadOutlinedIcon
              sx={{ fontSize: 60, color: 'success.main' }}
            />
          ),
          ...tu(t, 'proveedores', 4),
        },
        {
          target: '#table-row-actions',
          placement: 'left',
          icon: <TouchAppIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
          ...tu(t, 'proveedores', 5),
        },
        helpTutorialStep,
      ],
    },
    '/recetas': {
      steps: [
        {
          target: '#recipe-carousel-container',
          placement: 'bottom',
          icon: (
            <MenuBookOutlinedIcon
              sx={{ fontSize: 60, color: 'primary.main' }}
            />
          ),
          ...tu(t, 'recetas', 0),
        },
        {
          target: '#search-recetas',
          placement: 'bottom',
          icon: <SearchIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'recetas', 1),
        },
        {
          target: '#table-header-sort',
          placement: 'bottom',
          icon: (
            <SortByAlphaIcon sx={{ fontSize: 60, color: 'primary.main' }} />
          ),
          ...tu(t, 'recetas', 2),
        },
        {
          target: '#btn-nueva-receta',
          placement: 'bottom',
          icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          ...tu(t, 'recetas', 3),
        },
        {
          target: '#table-row-actions',
          placement: 'left',
          icon: <RestaurantIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          ...tu(t, 'recetas', 4),
        },
        helpTutorialStep,
      ],
    },
    '/pedidos': {
      steps: [
        {
          target: '#pedidos-tabs',
          placement: 'bottom',
          icon: (
            <AssignmentTurnedInOutlinedIcon
              sx={{ fontSize: 60, color: 'primary.main' }}
            />
          ),
          ...tu(t, 'pedidos', 0),
        },
        {
          target: '#btn-nuevo-pedido',
          placement: 'bottom',
          icon: (
            <AddShoppingCartIcon sx={{ fontSize: 60, color: 'success.main' }} />
          ),
          ...tu(t, 'pedidos', 1),
        },
        {
          target: '#btn-continuar-pedido',
          placement: 'bottom',
          icon: <HistoryIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
          ...tu(t, 'pedidos', 2),
        },
        {
          target: '#pedidos-content-area',
          placement: 'top',
          icon: <ShoppingCartIcon sx={{ fontSize: 60, color: 'info.main' }} />,
          ...tu(t, 'pedidos', 3),
        },
        {
          target: '#btn-reporte-pedidos-pdf',
          placement: 'bottom',
          icon: (
            <PictureAsPdfOutlinedIcon
              sx={{ fontSize: 60, color: 'error.main' }}
            />
          ),
          ...tu(t, 'pedidos', 4),
        },
        {
          target: '#btn-exportar-pedidos-excel',
          placement: 'bottom',
          icon: (
            <FileDownloadOutlinedIcon
              sx={{ fontSize: 60, color: 'success.main' }}
            />
          ),
          ...tu(t, 'pedidos', 5),
        },
        helpTutorialStep,
      ],
    },
    '/recepciones': {
      steps: [
        {
          target: '#recepcion-stepper',
          placement: 'bottom',
          icon: <RuleIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'recepciones', 0),
        },
        {
          target: '#recepcion-sync-status',
          placement: 'bottom',
          icon: <CloudSyncIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          ...tu(t, 'recepciones', 1),
        },
        {
          target: '#search-recepcion-productos',
          placement: 'bottom',
          icon: (
            <QrCodeScannerIcon sx={{ fontSize: 60, color: 'primary.main' }} />
          ),
          ...tu(t, 'recepciones', 2),
        },
        {
          target: '#scale-options-container',
          placement: 'bottom',
          icon: <BalanceIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          ...tu(t, 'recepciones', 3),
        },
        {
          target: '#btn-next-step',
          placement: 'top',
          icon: <TouchAppIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'recepciones', 4),
        },
        helpTutorialStep,
      ],
    },
    '/distribucion': {
      steps: [
        {
          target: '#distribucion-tabs',
          placement: 'bottom',
          icon: (
            <LocalShippingIcon sx={{ fontSize: 60, color: 'primary.main' }} />
          ),
          ...tu(t, 'distribucion', 0),
        },
        {
          target: '#search-distribucion',
          placement: 'bottom',
          icon: <SearchIcon sx={{ fontSize: 60, color: 'info.main' }} />,
          ...tu(t, 'distribucion', 1),
        },
        {
          target: '#distribucion-content-area',
          placement: 'top',
          icon: <InventoryIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
          ...tu(t, 'distribucion', 2),
        },
        {
          target: '#btn-distribuir-stock',
          placement: 'left',
          icon: <CallSplitIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'distribucion', 3),
        },
        {
          target: '#btn-confirmar-entrega',
          placement: 'left',
          icon: (
            <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />
          ),
          ...tu(t, 'distribucion', 4),
        },
        helpTutorialStep,
      ],
    },
    '/preparaciones': {
      steps: [
        {
          target: '#preparaciones-summary',
          placement: 'bottom',
          icon: <RestaurantIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'preparaciones', 0),
        },
        {
          target: '#preparaciones-tabs',
          placement: 'bottom',
          icon: <HistoryIcon sx={{ fontSize: 60, color: 'info.main' }} />,
          ...tu(t, 'preparaciones', 1),
        },
        {
          target: '#btn-consumir-preparacion',
          placement: 'left',
          icon: (
            <LocalDiningIcon sx={{ fontSize: 60, color: 'success.main' }} />
          ),
          ...tu(t, 'preparaciones', 2),
        },
        {
          target: '#btn-merma-preparacion',
          placement: 'left',
          icon: (
            <ReportProblemIcon sx={{ fontSize: 60, color: 'warning.main' }} />
          ),
          ...tu(t, 'preparaciones', 3),
        },
        {
          target: '#btn-ver-detalle-preparacion',
          placement: 'left',
          icon: <VisibilityIcon sx={{ fontSize: 60, color: 'info.main' }} />,
          ...tu(t, 'preparaciones', 4),
        },
        helpTutorialStep,
      ],
    },
    '/albaranes': {
      steps: [
        {
          target: '#albaranes-toolbar',
          placement: 'bottom',
          icon: (
            <AssignmentOutlinedIcon
              sx={{ fontSize: 60, color: 'primary.main' }}
            />
          ),
          ...tu(t, 'albaranes', 0),
        },
        {
          target: '#btn-nuevo-albaran',
          placement: 'bottom',
          icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          ...tu(t, 'albaranes', 1),
        },
        {
          target: '#btn-albaran-upload',
          placement: 'left',
          icon: <AttachFileIcon sx={{ fontSize: 60, color: 'info.main' }} />,
          ...tu(t, 'albaranes', 2),
        },
        {
          target: '#albaranes-table',
          placement: 'top',
          icon: (
            <CheckCircleOutlineIcon
              sx={{ fontSize: 60, color: 'success.main' }}
            />
          ),
          ...tu(t, 'albaranes', 3),
        },
        {
          target: '#btn-albaran-view',
          placement: 'left',
          icon: <VisibilityIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'albaranes', 4),
        },
        helpTutorialStep,
      ],
    },
    '/inventario': {
      steps: [
        {
          target: '#inventario-toolbar',
          placement: 'bottom',
          icon: <InventoryIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'inventario', 0),
        },
        {
          target: '#btn-add-inventario',
          placement: 'bottom',
          icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          ...tu(t, 'inventario', 1),
        },
        {
          target: '#btn-manage-locations',
          placement: 'bottom',
          icon: <SettingsIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
          ...tu(t, 'inventario', 2),
        },
        {
          target: '#search-inventario',
          placement: 'bottom',
          icon: (
            <QrCodeScannerIcon sx={{ fontSize: 60, color: 'primary.main' }} />
          ),
          ...tu(t, 'inventario', 3),
        },
        {
          target: '#inventario-filters',
          placement: 'bottom',
          icon: <FilterListIcon sx={{ fontSize: 60, color: 'info.main' }} />,
          ...tu(t, 'inventario', 4),
        },
        {
          target: '#inventario-tabs',
          placement: 'bottom',
          icon: <HomeWorkIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
          ...tu(t, 'inventario', 5),
        },
        {
          target: '#inventario-table',
          placement: 'top',
          icon: <SyncAltIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
          ...tu(t, 'inventario', 6),
        },
        helpTutorialStep,
      ],
    },
    '/movimientos': {
      steps: [
        {
          target: '#movimientos-toolbar',
          placement: 'bottom',
          disableFlip: true,
          icon: <HistoryIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'movimientos', 0),
        },
        {
          target: '#movimientos-filters',
          placement: 'bottom',
          icon: <FilterListIcon sx={{ fontSize: 60, color: 'info.main' }} />,
          ...tu(t, 'movimientos', 1),
        },
        {
          target: '#movimientos-table',
          placement: 'center',
          icon: <SearchIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          ...tu(t, 'movimientos', 2),
        },
        {
          target: '#btn-ver-detalle-movimiento',
          placement: 'left',
          icon: <VisibilityIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'movimientos', 3),
        },
        helpTutorialStep,
      ],
    },
    '/mermas': {
      steps: [
        {
          target: '#mermas-toolbar',
          placement: 'bottom',
          icon: (
            <BrokenImageOutlinedIcon
              sx={{ fontSize: 60, color: 'primary.main' }}
            />
          ),
          ...tu(t, 'mermas', 0),
        },
        {
          target: '#btn-reportar-merma',
          placement: 'bottom',
          icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          ...tu(t, 'mermas', 1),
        },
        {
          target: '#merma-stats',
          placement: 'bottom',
          icon: <AssessmentIcon sx={{ fontSize: 60, color: 'info.main' }} />,
          ...tu(t, 'mermas', 2),
        },
        {
          target: '#mermas-table-container',
          placement: 'center',
          icon: <HistoryIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
          ...tu(t, 'mermas', 3),
        },
        helpTutorialStep,
      ],
    },
    '/incidencias': {
      steps: [
        {
          target: '#incidencias-toolbar',
          placement: 'bottom',
          icon: (
            <ReportProblemIcon sx={{ fontSize: 60, color: 'primary.main' }} />
          ),
          ...tu(t, 'incidencias', 0),
        },
        {
          target: '#btn-reporte-incidencias-pdf',
          placement: 'bottom',
          icon: <PictureAsPdfIcon sx={{ fontSize: 60, color: 'error.main' }} />,
          ...tu(t, 'incidencias', 1),
        },
        {
          target: '#incidencias-tabs',
          placement: 'bottom',
          icon: (
            <PendingActionsIcon sx={{ fontSize: 60, color: 'info.main' }} />
          ),
          ...tu(t, 'incidencias', 2),
        },
        {
          target: '#incidencias-table',
          placement: 'center',
          icon: <SearchIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
          ...tu(t, 'incidencias', 3),
        },
        {
          target: '#btn-ajustar-incidencia',
          placement: 'left',
          icon: <TuneIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
          ...tu(t, 'incidencias', 4),
        },
        {
          target: '#btn-resolver-incidencia',
          placement: 'left',
          icon: (
            <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />
          ),
          ...tu(t, 'incidencias', 5),
        },
        helpTutorialStep,
      ],
    },
    '/administracion': {
      steps: [
        {
          target: '#admin-header',
          placement: 'bottom',
          icon: <SettingsIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'administracion', 0),
        },
        {
          target: '#admin-tabs',
          placement: 'bottom',
          icon: <SchoolIcon sx={{ fontSize: 60, color: 'info.main' }} />,
          ...tu(t, 'administracion', 1),
        },
        {
          target: '#admin-tab-usuarios',
          placement: 'bottom',
          icon: <PeopleIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          ...tu(t, 'administracion', 2),
        },
        {
          target: '#btn-gestionar-slots',
          placement: 'top',
          icon: <EditIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
          ...tu(t, 'administracion', 3),
        },
        helpTutorialStep,
      ],
    },
    '/perfil': {
      roles: {
        PROFESOR: [
          {
            icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
            ...tu(t, 'perfilProfesor', 0),
          },
          {
            icon: <LockIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
            ...tu(t, 'perfilProfesor', 1),
          },
        ],
        ALUMNO: [
          {
            icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
            ...tu(t, 'perfilAlumno', 0),
          },
        ],
      },
    },
    default: {
      steps: [
        {
          target: '#sidebar-nav',
          placement: 'right',
          icon: <HelpIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          ...tu(t, 'default', 0),
        },
        {
          target: '#user-menu-button', // ID a añadir en MainLayout
          placement: 'bottom',
          icon: <SettingsIcon sx={{ fontSize: 60, color: 'action.active' }} />,
          ...tu(t, 'default', 1),
        },
      ],
    },
  };
}
