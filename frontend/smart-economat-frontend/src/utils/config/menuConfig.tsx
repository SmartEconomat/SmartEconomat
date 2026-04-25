import React from 'react';
import HomeIconOption from '@mui/icons-material/HomeOutlined';
import InventoryIconOption from '@mui/icons-material/InventoryOutlined';
import ShoppingCartIconOption from '@mui/icons-material/ShoppingCartOutlined';
import LoginIconOption from '@mui/icons-material/LoginOutlined';
import PersonIconOption from '@mui/icons-material/PersonOutlined';
import ReportProblemIconOption from '@mui/icons-material/ReportProblemOutlined';
import SwapHorizIconOption from '@mui/icons-material/SwapHorizOutlined';
import LocalShippingIconOption from '@mui/icons-material/LocalShippingOutlined';
import CategoryIconOption from '@mui/icons-material/CategoryOutlined';
import MenuBookIconOption from '@mui/icons-material/MenuBookOutlined';
import RestaurantIconOption from '@mui/icons-material/RestaurantOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import { PERMISSIONS } from '../../sherlock-auth/permissions.constants';
import {
  SYSTEM_ROLES,
  ELEVATED_ROLES,
} from '../../sherlock-auth/system-roles.constants';

// Lazy load components
const Home = React.lazy(() => import('../../pages/Home'));
const Albaranes = React.lazy(() => import('../../pages/Albaran'));
const Productos = React.lazy(() => import('../../pages/Productos'));
const Pedidos = React.lazy(() => import('../../pages/Pedidos'));
const Recepcion = React.lazy(() => import('../../pages/Recepcion'));
const Inventario = React.lazy(() => import('../../pages/Inventario'));
const Incidencias = React.lazy(() => import('../../pages/Incidencias'));
const Movimientos = React.lazy(() => import('../../pages/Movimientos'));
const Proveedores = React.lazy(() => import('../../pages/Proveedores'));
const Recetas = React.lazy(() => import('../../pages/Recetas'));
const Preparaciones = React.lazy(() => import('../../pages/Preparaciones'));
const Mermas = React.lazy(() => import('../../pages/Mermas'));
const Distribucion = React.lazy(() => import('../../pages/Distribucion'));

const Perfil = React.lazy(() => import('../../pages/Perfil'));
const Administracion = React.lazy(() => import('../../pages/Administracion'));

export interface MenuItem {
  path: string;
  title: string;
  description: string;
  i18nKey: string;
  group: 'inicio' | 'catalogo' | 'operaciones' | 'control' | 'gestion';
  icon?: React.ReactNode;
  component: React.ComponentType<Record<string, unknown>>;
  showInMenu: boolean;
  roles?: string[];
  permiso?: string;
  anyPermissions?: string[];
}

export const menuItems: MenuItem[] = [
  {
    path: '/',
    title: 'Inicio',
    description: 'Ver resumen general y métricas del economato',
    i18nKey: 'inicio',
    group: 'inicio',
    icon: <HomeIconOption />,
    component: Home,
    showInMenu: true,
    permiso: PERMISSIONS.dashboard.ver_estadisticas,
  },
  {
    path: '/productos',
    title: 'Productos',
    description: 'Gestionar catálogo de productos y precios',
    i18nKey: 'productos',
    group: 'catalogo',
    icon: <CategoryIconOption />,
    component: Productos,
    showInMenu: true,
    permiso: PERMISSIONS.productos.listar,
  },
  {
    path: '/proveedores',
    title: 'Proveedores',
    description: 'Gestionar información de proveedores externos',
    i18nKey: 'proveedores',
    group: 'catalogo',
    icon: <LocalShippingIconOption />,
    component: Proveedores,
    showInMenu: true,
    permiso: PERMISSIONS.proveedores.listar,
  },
  {
    path: '/recetas',
    title: 'Recetas',
    description: 'Catálogo de recetas y escandallos',
    i18nKey: 'recetas',
    group: 'catalogo',
    icon: <MenuBookIconOption />,
    component: Recetas,
    showInMenu: true,
    permiso: PERMISSIONS.recetas.listar,
  },
  {
    path: '/pedidos',
    title: 'Pedidos',
    description: 'Administrar pedidos de usuarios y proveedores',
    i18nKey: 'pedidos',
    group: 'operaciones',
    icon: <ShoppingCartIconOption />,
    component: Pedidos,
    showInMenu: true,
    permiso: PERMISSIONS.pedidos.listar,
  },
  {
    path: '/recepciones',
    title: 'Recepción',
    description: 'Registrar entrada de mercancía al almacén',
    i18nKey: 'recepcion',
    group: 'operaciones',
    icon: <LoginIconOption />,
    component: Recepcion,
    showInMenu: true,
    permiso: PERMISSIONS.recepciones.listar,
  },
  {
    path: '/distribucion',
    title: 'Distribución',
    description: 'Gestionar salidas y distribución de productos',
    i18nKey: 'distribucion',
    group: 'operaciones',
    icon: <CallSplitIcon />,
    component: Distribucion,
    showInMenu: true,
    permiso: PERMISSIONS.distribuciones.listar,
  },
  {
    path: '/preparaciones',
    title: 'Preparaciones',
    description: 'Historial de producción de recetas',
    i18nKey: 'preparaciones',
    group: 'operaciones',
    icon: <RestaurantIconOption />,
    component: Preparaciones,
    showInMenu: true,
    permiso: PERMISSIONS.recetas.listar,
  },
  {
    path: '/albaranes',
    title: 'Albaranes',
    description: 'Gestionar y digitalizar albaranes de recepción',
    i18nKey: 'albaranes',
    group: 'operaciones',
    icon: <AssignmentOutlinedIcon />,
    component: Albaranes,
    showInMenu: true,
    permiso: PERMISSIONS.albaranes.listar,
  },
  {
    path: '/inventario',
    title: 'Inventario',
    description: 'Controlar stock y realizar ajustes de inventario',
    i18nKey: 'inventario',
    group: 'control',
    icon: <InventoryIconOption />,
    component: Inventario,
    showInMenu: true,
    permiso: PERMISSIONS.inventario.listar,
  },
  {
    path: '/movimientos',
    title: 'Movimientos',
    description: 'Consultar historial de movimientos de stock',
    i18nKey: 'movimientos',
    group: 'control',
    icon: <SwapHorizIconOption />,
    component: Movimientos,
    showInMenu: true,
    permiso: PERMISSIONS.movimientos.listar,
  },
  {
    path: '/mermas',
    title: 'Mermas',
    description: 'Gestión de pérdidas y roturas de productos',
    i18nKey: 'mermas',
    group: 'control',
    icon: <BrokenImageOutlinedIcon />,
    component: Mermas,
    showInMenu: true,
    permiso: PERMISSIONS.merma.listar,
  },
  {
    path: '/incidencias',
    title: 'Incidencias',
    description: 'Reportar y gestionar problemas o devoluciones',
    i18nKey: 'incidencias',
    group: 'control',
    icon: <ReportProblemIconOption />,
    component: Incidencias,
    showInMenu: true,
    permiso: PERMISSIONS.incidencias.listar,
  },
  {
    path: '/administracion',
    title: 'Administración',
    description: 'Gestión de clases, alumnos y configuración académica',
    i18nKey: 'administracion',
    group: 'gestion',
    icon: <AdminPanelSettingsIcon />,
    component: Administracion,
    showInMenu: true,
    roles: [SYSTEM_ROLES.PROFESOR, ...ELEVATED_ROLES],
    anyPermissions: [
      PERMISSIONS.usuarios.listar,
      PERMISSIONS.profesor.gestionar_slots,
      PERMISSIONS.profesor.ver_alumnos,
    ],
  },
  {
    path: '/perfil',
    title: 'Mi Perfil',
    description: 'Configurar datos personales y seguridad',
    i18nKey: 'miPerfil',
    group: 'gestion',
    icon: <PersonIconOption />,
    component: Perfil,
    showInMenu: false,
  },
];
