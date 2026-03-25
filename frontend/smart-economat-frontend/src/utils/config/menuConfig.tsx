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

const Perfil = React.lazy(() => import('../../pages/Perfil'));
const Administracion = React.lazy(() => import('../../pages/Administracion'));

export interface MenuItem {
  path: string;
  title: string;
  description: string;
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
    icon: <HomeIconOption />,
    component: Home,
    showInMenu: true,
    permiso: 'dashboard:ver_estadisticas',
  },
  {
    path: '/productos',
    title: 'Productos',
    description: 'Gestionar catálogo de productos y precios',
    icon: <CategoryIconOption />,
    component: Productos,
    showInMenu: true,
    permiso: 'productos:listar',
  },
  {
    path: '/proveedores',
    title: 'Proveedores',
    description: 'Gestionar información de proveedores externos',
    icon: <LocalShippingIconOption />,
    component: Proveedores,
    showInMenu: true,
    permiso: 'proveedores:listar',
  },
  {
    path: '/recetas',
    title: 'Recetas',
    description: 'Catálogo de recetas y escandallos',
    icon: <MenuBookIconOption />,
    component: Recetas,
    showInMenu: true,
    permiso: 'recetas:listar',
  },
  {
    path: '/pedidos',
    title: 'Pedidos',
    description: 'Administrar pedidos de usuarios y proveedores',
    icon: <ShoppingCartIconOption />,
    component: Pedidos,
    showInMenu: true,
    permiso: 'pedidos:listar',
  },
  {
    path: '/recepciones',
    title: 'Recepción',
    description: 'Registrar entrada de mercancía al almacén',
    icon: <LoginIconOption />,
    component: Recepcion,
    showInMenu: true,
    permiso: 'recepciones:listar',
  },
  {
    path: '/albaranes',
    title: 'Albaranes',
    description: 'Gestionar y digitalizar albaranes de recepción',
    icon: <AssignmentOutlinedIcon />,
    component: Albaranes,
    showInMenu: true,
    permiso: 'albaranes:listar',
  },
  {
    path: '/inventario',
    title: 'Inventario',
    description: 'Controlar stock y realizar ajustes de inventario',
    icon: <InventoryIconOption />,
    component: Inventario,
    showInMenu: true,
    permiso: 'inventario:listar',
  },
  {
    path: '/movimientos',
    title: 'Movimientos',
    description: 'Consultar historial de movimientos de stock',
    icon: <SwapHorizIconOption />,
    component: Movimientos,
    showInMenu: true,
    permiso: 'movimientos:listar',
  },
  {
    path: '/preparaciones',
    title: 'Preparaciones',
    description: 'Historial de producción de recetas',
    icon: <RestaurantIconOption />,
    component: Preparaciones,
    showInMenu: true,
    permiso: 'recetas:listar',
  },
  {
    path: '/incidencias',
    title: 'Incidencias',
    description: 'Reportar y gestionar problemas o devoluciones',
    icon: <ReportProblemIconOption />,
    component: Incidencias,
    showInMenu: true,
    permiso: 'incidencias:listar',
  },
  {
    path: '/mermas',
    title: 'Mermas',
    description: 'Gestión de pérdidas y roturas de productos',
    icon: <ReportProblemIconOption />,
    component: Mermas,
    showInMenu: true,
    permiso: 'merma:listar',
  },
  {
    path: '/administracion',
    title: 'Administración',
    description: 'Gestión de clases, alumnos y configuración académica',
    icon: <AdminPanelSettingsIcon />,
    component: Administracion,
    showInMenu: true,
    roles: ['PROFESOR', 'ADMIN', 'ADMINISTRADOR', 'SUPER_ADMIN'],
    anyPermissions: [
      'usuarios:listar',
      'profesor:gestionar_slots',
      'profesor:ver_alumnos',
    ],
  },
  {
    path: '/perfil',
    title: 'Mi Perfil',
    description: 'Configurar datos personales y seguridad',
    icon: <PersonIconOption />,
    component: Perfil,
    showInMenu: false,
  },
];
