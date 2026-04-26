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
    title: 'navigation.items.inicio.title',
    description: 'navigation.items.inicio.description',
    i18nKey: 'inicio',
    group: 'inicio',
    icon: <HomeIconOption />,
    component: Home,
    showInMenu: true,
    permiso: PERMISSIONS.dashboard.ver_estadisticas,
  },
  {
    path: '/productos',
    title: 'navigation.items.productos.title',
    description: 'navigation.items.productos.description',
    i18nKey: 'productos',
    group: 'catalogo',
    icon: <CategoryIconOption />,
    component: Productos,
    showInMenu: true,
    permiso: PERMISSIONS.productos.listar,
  },
  {
    path: '/proveedores',
    title: 'navigation.items.proveedores.title',
    description: 'navigation.items.proveedores.description',
    i18nKey: 'proveedores',
    group: 'catalogo',
    icon: <LocalShippingIconOption />,
    component: Proveedores,
    showInMenu: true,
    permiso: PERMISSIONS.proveedores.listar,
  },
  {
    path: '/recetas',
    title: 'navigation.items.recetas.title',
    description: 'navigation.items.recetas.description',
    i18nKey: 'recetas',
    group: 'catalogo',
    icon: <MenuBookIconOption />,
    component: Recetas,
    showInMenu: true,
    permiso: PERMISSIONS.recetas.listar,
  },
  {
    path: '/pedidos',
    title: 'navigation.items.pedidos.title',
    description: 'navigation.items.pedidos.description',
    i18nKey: 'pedidos',
    group: 'operaciones',
    icon: <ShoppingCartIconOption />,
    component: Pedidos,
    showInMenu: true,
    permiso: PERMISSIONS.pedidos.listar,
  },
  {
    path: '/recepciones',
    title: 'navigation.items.recepcion.title',
    description: 'navigation.items.recepcion.description',
    i18nKey: 'recepcion',
    group: 'operaciones',
    icon: <LoginIconOption />,
    component: Recepcion,
    showInMenu: true,
    permiso: PERMISSIONS.recepciones.listar,
  },
  {
    path: '/distribucion',
    title: 'navigation.items.distribucion.title',
    description: 'navigation.items.distribucion.description',
    i18nKey: 'distribucion',
    group: 'operaciones',
    icon: <CallSplitIcon />,
    component: Distribucion,
    showInMenu: true,
    permiso: PERMISSIONS.distribuciones.listar,
  },
  {
    path: '/preparaciones',
    title: 'navigation.items.preparaciones.title',
    description: 'navigation.items.preparaciones.description',
    i18nKey: 'preparaciones',
    group: 'operaciones',
    icon: <RestaurantIconOption />,
    component: Preparaciones,
    showInMenu: true,
    permiso: PERMISSIONS.recetas.listar,
  },
  {
    path: '/albaranes',
    title: 'navigation.items.albaranes.title',
    description: 'navigation.items.albaranes.description',
    i18nKey: 'albaranes',
    group: 'operaciones',
    icon: <AssignmentOutlinedIcon />,
    component: Albaranes,
    showInMenu: true,
    permiso: PERMISSIONS.albaranes.listar,
  },
  {
    path: '/inventario',
    title: 'navigation.items.inventario.title',
    description: 'navigation.items.inventario.description',
    i18nKey: 'inventario',
    group: 'control',
    icon: <InventoryIconOption />,
    component: Inventario,
    showInMenu: true,
    permiso: PERMISSIONS.inventario.listar,
  },
  {
    path: '/movimientos',
    title: 'navigation.items.movimientos.title',
    description: 'navigation.items.movimientos.description',
    i18nKey: 'movimientos',
    group: 'control',
    icon: <SwapHorizIconOption />,
    component: Movimientos,
    showInMenu: true,
    permiso: PERMISSIONS.movimientos.listar,
  },
  {
    path: '/mermas',
    title: 'navigation.items.mermas.title',
    description: 'navigation.items.mermas.description',
    i18nKey: 'mermas',
    group: 'control',
    icon: <BrokenImageOutlinedIcon />,
    component: Mermas,
    showInMenu: true,
    permiso: PERMISSIONS.merma.listar,
  },
  {
    path: '/incidencias',
    title: 'navigation.items.incidencias.title',
    description: 'navigation.items.incidencias.description',
    i18nKey: 'incidencias',
    group: 'control',
    icon: <ReportProblemIconOption />,
    component: Incidencias,
    showInMenu: true,
    permiso: PERMISSIONS.incidencias.listar,
  },
  {
    path: '/administracion',
    title: 'navigation.items.administracion.title',
    description: 'navigation.items.administracion.description',
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
    title: 'navigation.items.miPerfil.title',
    description: 'navigation.items.miPerfil.description',
    i18nKey: 'miPerfil',
    group: 'gestion',
    icon: <PersonIconOption />,
    component: Perfil,
    showInMenu: false,
  },
];
