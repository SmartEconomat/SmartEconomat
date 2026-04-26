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
  /** Selector CSS del elemento a resaltar */
  target?: string;
  /** Posición preferida del diálogo respecto al elemento */
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
  /** Evitar que el diálogo se mueva de su posición preferida */
  disableFlip?: boolean;
  /** Icono para el diálogo */
  icon: React.ReactNode;
  /** Título conciso */
  title: string;
  /** Descripción clara y útil (UX Writing) */
  description: string;
}

export interface TutorialConfigItem {
  steps?: TutorialStep[];
  roles?: Record<string, TutorialStep[]>;
}

/**
 * Paso común para finalizar todos los tutoriales indicando dónde encontrar ayuda.
 */
const getHelpTutorialStep = (t: TFunction): TutorialStep => ({
  target: '#help-tutorial-button',
  placement: 'right',
  icon: <HelpOutlineIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
  title: t('tutorial.ayuda.title'),
  description: t('tutorial.ayuda.description'),
});

export const getTutorialConfig = (
  t: TFunction
): Record<string, TutorialConfigItem> => ({
  '/': {
    steps: [
      {
        target: '#dashboard-welcome',
        placement: 'bottom',
        icon: <DashboardIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.inicio.s0.title'),
        description: t('tutorial.inicio.s0.description'),
      },
      {
        target: '#sidebar-nav',
        placement: 'right',
        icon: <MenuIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: t('tutorial.inicio.s1.title'),
        description: t('tutorial.inicio.s1.description'),
      },
      {
        target: '#dashboard-stats',
        placement: 'center',
        icon: <TrendingUpIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.inicio.s2.title'),
        description: t('tutorial.inicio.s2.description'),
      },
      {
        target: '#dashboard-quick-actions',
        placement: 'center',
        icon: <TouchAppIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: t('tutorial.inicio.s3.title'),
        description: t('tutorial.inicio.s3.description'),
      },
      {
        target: '#btn-notifications',
        placement: 'bottom',
        icon: <NotificationsIcon sx={{ fontSize: 60, color: 'error.main' }} />,
        title: t('tutorial.inicio.s4.title'),
        description: t('tutorial.inicio.s4.description'),
      },
      {
        target: '#dashboard-activity',
        placement: 'left',
        icon: <HistoryIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
        title: t('tutorial.inicio.s5.title'),
        description: t('tutorial.inicio.s5.description'),
      },
      {
        target: '#user-menu-button',
        placement: 'bottom',
        icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.inicio.s6.title'),
        description: t('tutorial.inicio.s6.description'),
      },
      getHelpTutorialStep(t),
    ],
  },
  '/productos': {
    steps: [
      {
        target: '#search-productos',
        placement: 'bottom',
        icon: <SearchIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.productos.s0.title'),
        description: t('tutorial.productos.s0.description'),
      },
      {
        target: '#filter-productos',
        placement: 'bottom',
        icon: <FilterListIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.productos.s1.title'),
        description: t('tutorial.productos.s1.description'),
      },
      {
        target: '#table-header-sort',
        placement: 'bottom',
        icon: <SortByAlphaIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.productos.s2.title'),
        description: t('tutorial.productos.s2.description'),
      },
      {
        target: '#btn-nuevo-producto',
        placement: 'bottom',
        icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.productos.s3.title'),
        description: t('tutorial.productos.s3.description'),
      },
      {
        target: '#btn-exportar-productos-pdf',
        placement: 'bottom',
        icon: (
          <PictureAsPdfOutlinedIcon
            sx={{ fontSize: 60, color: 'error.main' }}
          />
        ),
        title: t('tutorial.productos.s4.title'),
        description: t('tutorial.productos.s4.description'),
      },
      {
        target: '#btn-exportar-productos-excel',
        placement: 'bottom',
        icon: (
          <FileDownloadOutlinedIcon
            sx={{ fontSize: 60, color: 'success.main' }}
          />
        ),
        title: t('tutorial.productos.s5.title'),
        description: t('tutorial.productos.s5.description'),
      },
      {
        target: '#table-row-actions',
        placement: 'left',
        icon: <TouchAppIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: t('tutorial.productos.s6.title'),
        description: t('tutorial.productos.s6.description'),
      },
      getHelpTutorialStep(t),
    ],
  },
  '/proveedores': {
    steps: [
      {
        target: '#search-proveedores',
        placement: 'bottom',
        icon: <SearchIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.proveedores.s0.title'),
        description: t('tutorial.proveedores.s0.description'),
      },
      {
        target: '#table-header-sort',
        placement: 'bottom',
        icon: <SortByAlphaIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.proveedores.s1.title'),
        description: t('tutorial.proveedores.s1.description'),
      },
      {
        target: '#btn-nuevo-proveedor',
        placement: 'bottom',
        icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.proveedores.s2.title'),
        description: t('tutorial.proveedores.s2.description'),
      },
      {
        target: '#btn-export-pdf',
        placement: 'bottom',
        icon: (
          <PictureAsPdfOutlinedIcon
            sx={{ fontSize: 60, color: 'error.main' }}
          />
        ),
        title: t('tutorial.proveedores.s3.title'),
        description: t('tutorial.proveedores.s3.description'),
      },
      {
        target: '#btn-export-excel',
        placement: 'bottom',
        icon: (
          <FileDownloadOutlinedIcon
            sx={{ fontSize: 60, color: 'success.main' }}
          />
        ),
        title: t('tutorial.proveedores.s4.title'),
        description: t('tutorial.proveedores.s4.description'),
      },
      {
        target: '#table-row-actions',
        placement: 'left',
        icon: <TouchAppIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: t('tutorial.proveedores.s5.title'),
        description: t('tutorial.proveedores.s5.description'),
      },
      getHelpTutorialStep(t),
    ],
  },
  '/recetas': {
    steps: [
      {
        target: '#recipe-carousel-container',
        placement: 'bottom',
        icon: (
          <MenuBookOutlinedIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        ),
        title: t('tutorial.recetas.s0.title'),
        description: t('tutorial.recetas.s0.description'),
      },
      {
        target: '#search-recetas',
        placement: 'bottom',
        icon: <SearchIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.recetas.s1.title'),
        description: t('tutorial.recetas.s1.description'),
      },
      {
        target: '#table-header-sort',
        placement: 'bottom',
        icon: <SortByAlphaIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.recetas.s2.title'),
        description: t('tutorial.recetas.s2.description'),
      },
      {
        target: '#btn-nueva-receta',
        placement: 'bottom',
        icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.recetas.s3.title'),
        description: t('tutorial.recetas.s3.description'),
      },
      {
        target: '#table-row-actions',
        placement: 'left',
        icon: <RestaurantIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.recetas.s4.title'),
        description: t('tutorial.recetas.s4.description'),
      },
      getHelpTutorialStep(t),
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
        title: t('tutorial.pedidos.s0.title'),
        description: t('tutorial.pedidos.s0.description'),
      },
      {
        target: '#btn-nuevo-pedido',
        placement: 'bottom',
        icon: (
          <AddShoppingCartIcon sx={{ fontSize: 60, color: 'success.main' }} />
        ),
        title: t('tutorial.pedidos.s1.title'),
        description: t('tutorial.pedidos.s1.description'),
      },
      {
        target: '#btn-continuar-pedido',
        placement: 'bottom',
        icon: <HistoryIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
        title: t('tutorial.pedidos.s2.title'),
        description: t('tutorial.pedidos.s2.description'),
      },
      {
        target: '#pedidos-content-area',
        placement: 'top',
        icon: <ShoppingCartIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: t('tutorial.pedidos.s3.title'),
        description: t('tutorial.pedidos.s3.description'),
      },
      {
        target: '#btn-reporte-pedidos-pdf',
        placement: 'bottom',
        icon: (
          <PictureAsPdfOutlinedIcon
            sx={{ fontSize: 60, color: 'error.main' }}
          />
        ),
        title: t('tutorial.pedidos.s4.title'),
        description: t('tutorial.pedidos.s4.description'),
      },
      {
        target: '#btn-exportar-pedidos-excel',
        placement: 'bottom',
        icon: (
          <FileDownloadOutlinedIcon
            sx={{ fontSize: 60, color: 'success.main' }}
          />
        ),
        title: t('tutorial.pedidos.s5.title'),
        description: t('tutorial.pedidos.s5.description'),
      },
      getHelpTutorialStep(t),
    ],
  },
  '/recepciones': {
    steps: [
      {
        target: '#recepcion-stepper',
        placement: 'bottom',
        icon: <RuleIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.recepciones.s0.title'),
        description: t('tutorial.recepciones.s0.description'),
      },
      {
        target: '#recepcion-sync-status',
        placement: 'bottom',
        icon: <CloudSyncIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.recepciones.s1.title'),
        description: t('tutorial.recepciones.s1.description'),
      },
      {
        target: '#search-recepcion-productos',
        placement: 'bottom',
        icon: (
          <QrCodeScannerIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        ),
        title: t('tutorial.recepciones.s2.title'),
        description: t('tutorial.recepciones.s2.description'),
      },
      {
        target: '#scale-options-container',
        placement: 'bottom',
        icon: <BalanceIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.recepciones.s3.title'),
        description: t('tutorial.recepciones.s3.description'),
      },
      {
        target: '#btn-next-step',
        placement: 'top',
        icon: <TouchAppIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.recepciones.s4.title'),
        description: t('tutorial.recepciones.s4.description'),
      },
      getHelpTutorialStep(t),
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
        title: t('tutorial.distribucion.s0.title'),
        description: t('tutorial.distribucion.s0.description'),
      },
      {
        target: '#search-distribucion',
        placement: 'bottom',
        icon: <SearchIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: t('tutorial.distribucion.s1.title'),
        description: t('tutorial.distribucion.s1.description'),
      },
      {
        target: '#distribucion-content-area',
        placement: 'top',
        icon: <InventoryIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
        title: t('tutorial.distribucion.s2.title'),
        description: t('tutorial.distribucion.s2.description'),
      },
      {
        target: '#btn-distribuir-stock',
        placement: 'left',
        icon: <CallSplitIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.distribucion.s3.title'),
        description: t('tutorial.distribucion.s3.description'),
      },
      {
        target: '#btn-confirmar-entrega',
        placement: 'left',
        icon: <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.distribucion.s4.title'),
        description: t('tutorial.distribucion.s4.description'),
      },
      getHelpTutorialStep(t),
    ],
  },
  '/preparaciones': {
    steps: [
      {
        target: '#preparaciones-summary',
        placement: 'bottom',
        icon: <RestaurantIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.preparaciones.s0.title'),
        description: t('tutorial.preparaciones.s0.description'),
      },
      {
        target: '#preparaciones-tabs',
        placement: 'bottom',
        icon: <HistoryIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: t('tutorial.preparaciones.s1.title'),
        description: t('tutorial.preparaciones.s1.description'),
      },
      {
        target: '#btn-consumir-preparacion',
        placement: 'left',
        icon: <LocalDiningIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.preparaciones.s2.title'),
        description: t('tutorial.preparaciones.s2.description'),
      },
      {
        target: '#btn-merma-preparacion',
        placement: 'left',
        icon: (
          <ReportProblemIcon sx={{ fontSize: 60, color: 'warning.main' }} />
        ),
        title: t('tutorial.preparaciones.s3.title'),
        description: t('tutorial.preparaciones.s3.description'),
      },
      {
        target: '#btn-ver-detalle-preparacion',
        placement: 'left',
        icon: <VisibilityIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: t('tutorial.preparaciones.s4.title'),
        description: t('tutorial.preparaciones.s4.description'),
      },
      getHelpTutorialStep(t),
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
        title: t('tutorial.albaranes.s0.title'),
        description: t('tutorial.albaranes.s0.description'),
      },
      {
        target: '#btn-nuevo-albaran',
        placement: 'bottom',
        icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.albaranes.s1.title'),
        description: t('tutorial.albaranes.s1.description'),
      },
      {
        target: '#btn-albaran-upload',
        placement: 'left',
        icon: <AttachFileIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: t('tutorial.albaranes.s2.title'),
        description: t('tutorial.albaranes.s2.description'),
      },
      {
        target: '#albaranes-table',
        placement: 'top',
        icon: (
          <CheckCircleOutlineIcon
            sx={{ fontSize: 60, color: 'success.main' }}
          />
        ),
        title: t('tutorial.albaranes.s3.title'),
        description: t('tutorial.albaranes.s3.description'),
      },
      {
        target: '#btn-albaran-view',
        placement: 'left',
        icon: <VisibilityIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.albaranes.s4.title'),
        description: t('tutorial.albaranes.s4.description'),
      },
      getHelpTutorialStep(t),
    ],
  },
  '/inventario': {
    steps: [
      {
        target: '#inventario-toolbar',
        placement: 'bottom',
        icon: <InventoryIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.inventario.s0.title'),
        description: t('tutorial.inventario.s0.description'),
      },
      {
        target: '#btn-add-inventario',
        placement: 'bottom',
        icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.inventario.s1.title'),
        description: t('tutorial.inventario.s1.description'),
      },
      {
        target: '#btn-manage-locations',
        placement: 'bottom',
        icon: <SettingsIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: t('tutorial.inventario.s2.title'),
        description: t('tutorial.inventario.s2.description'),
      },
      {
        target: '#search-inventario',
        placement: 'bottom',
        icon: (
          <QrCodeScannerIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        ),
        title: t('tutorial.inventario.s3.title'),
        description: t('tutorial.inventario.s3.description'),
      },
      {
        target: '#inventario-filters',
        placement: 'bottom',
        icon: <FilterListIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: t('tutorial.inventario.s4.title'),
        description: t('tutorial.inventario.s4.description'),
      },
      {
        target: '#inventario-tabs',
        placement: 'bottom',
        icon: <HomeWorkIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
        title: t('tutorial.inventario.s5.title'),
        description: t('tutorial.inventario.s5.description'),
      },
      {
        target: '#inventario-table',
        placement: 'top',
        icon: <SyncAltIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: t('tutorial.inventario.s6.title'),
        description: t('tutorial.inventario.s6.description'),
      },
      getHelpTutorialStep(t),
    ],
  },
  '/movimientos': {
    steps: [
      {
        target: '#movimientos-toolbar',
        placement: 'bottom',
        disableFlip: true,
        icon: <HistoryIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.movimientos.s0.title'),
        description: t('tutorial.movimientos.s0.description'),
      },
      {
        target: '#movimientos-filters',
        placement: 'bottom',
        icon: <FilterListIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: t('tutorial.movimientos.s1.title'),
        description: t('tutorial.movimientos.s1.description'),
      },
      {
        target: '#movimientos-table',
        placement: 'center',
        icon: <SearchIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.movimientos.s2.title'),
        description: t('tutorial.movimientos.s2.description'),
      },
      {
        target: '#btn-ver-detalle-movimiento',
        placement: 'left',
        icon: <VisibilityIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.movimientos.s3.title'),
        description: t('tutorial.movimientos.s3.description'),
      },
      getHelpTutorialStep(t),
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
        title: t('tutorial.mermas.s0.title'),
        description: t('tutorial.mermas.s0.description'),
      },
      {
        target: '#btn-reportar-merma',
        placement: 'bottom',
        icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.mermas.s1.title'),
        description: t('tutorial.mermas.s1.description'),
      },
      {
        target: '#merma-stats',
        placement: 'bottom',
        icon: <AssessmentIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: t('tutorial.mermas.s2.title'),
        description: t('tutorial.mermas.s2.description'),
      },
      {
        target: '#mermas-table-container',
        placement: 'center',
        icon: <HistoryIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: t('tutorial.mermas.s3.title'),
        description: t('tutorial.mermas.s3.description'),
      },
      getHelpTutorialStep(t),
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
        title: t('tutorial.incidencias.s0.title'),
        description: t('tutorial.incidencias.s0.description'),
      },
      {
        target: '#btn-reporte-incidencias-pdf',
        placement: 'bottom',
        icon: <PictureAsPdfIcon sx={{ fontSize: 60, color: 'error.main' }} />,
        title: t('tutorial.incidencias.s1.title'),
        description: t('tutorial.incidencias.s1.description'),
      },
      {
        target: '#incidencias-tabs',
        placement: 'bottom',
        icon: <PendingActionsIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: t('tutorial.incidencias.s2.title'),
        description: t('tutorial.incidencias.s2.description'),
      },
      {
        target: '#incidencias-table',
        placement: 'center',
        icon: <SearchIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: t('tutorial.incidencias.s3.title'),
        description: t('tutorial.incidencias.s3.description'),
      },
      {
        target: '#btn-ajustar-incidencia',
        placement: 'left',
        icon: <TuneIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
        title: t('tutorial.incidencias.s4.title'),
        description: t('tutorial.incidencias.s4.description'),
      },
      {
        target: '#btn-resolver-incidencia',
        placement: 'left',
        icon: <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.incidencias.s5.title'),
        description: t('tutorial.incidencias.s5.description'),
      },
      getHelpTutorialStep(t),
    ],
  },
  '/administracion': {
    steps: [
      {
        target: '#admin-header',
        placement: 'bottom',
        icon: <SettingsIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: t('tutorial.administracion.s0.title'),
        description: t('tutorial.administracion.s0.description'),
      },
      {
        target: '#admin-tabs',
        placement: 'bottom',
        icon: <SchoolIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: t('tutorial.administracion.s1.title'),
        description: t('tutorial.administracion.s1.description'),
      },
      {
        target: '#admin-tab-usuarios',
        placement: 'bottom',
        icon: <PeopleIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: t('tutorial.administracion.s2.title'),
        description: t('tutorial.administracion.s2.description'),
      },
      {
        target: '#btn-gestionar-slots',
        placement: 'top',
        icon: <EditIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: t('tutorial.administracion.s3.title'),
        description: t('tutorial.administracion.s3.description'),
      },
      getHelpTutorialStep(t),
    ],
  },
  '/perfil': {
    roles: {
      PROFESOR: [
        {
          icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          title: t('tutorial.perfil.s0.title'),
          description: t('tutorial.perfil.s0.description'),
        },
        {
          icon: <LockIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
          title: t('tutorial.perfil.s1.title'),
          description: t('tutorial.perfil.s1.description'),
        },
        // ... otros pasos del rol
      ],
      ALUMNO: [
        {
          icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          title: t('tutorial.perfil.s2.title'),
          description: t('tutorial.perfil.s2.description'),
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
        title: t('tutorial.perfil.s3.title'),
        description: t('tutorial.perfil.s3.description'),
      },
      {
        target: '#user-menu-button', // ID a añadir en MainLayout
        placement: 'bottom',
        icon: <SettingsIcon sx={{ fontSize: 60, color: 'action.active' }} />,
        title: t('tutorial.perfil.s4.title'),
        description: t('tutorial.perfil.s4.description'),
      },
    ],
  },
});
