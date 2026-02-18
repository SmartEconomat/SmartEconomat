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

// Lazy load components
const Home = React.lazy(() => import('../../pages/Home'));
const Productos = React.lazy(() => import('../../pages/Productos'));
const Pedidos = React.lazy(() => import('../../pages/Pedidos'));
const Recepcion = React.lazy(() => import('../../pages/Recepcion'));
const Inventario = React.lazy(() => import('../../pages/Inventario'));
const Incidencias = React.lazy(() => import('../../pages/Incidencias'));
const Movimientos = React.lazy(() => import('../../pages/Movimientos'));
const Proveedores = React.lazy(() => import('../../pages/Proveedores'));
const Usuario = React.lazy(() => import('../../pages/Usuario'));

export interface MenuItem {
    path: string;
    title: string;
    description: string;
    icon?: React.ReactNode;
    component: React.ComponentType<any>;
    showInMenu: boolean;
}

export const menuItems: MenuItem[] = [
    {
        path: '/',
        title: 'Inicio',
        description: 'Ver resumen general y métricas del economato',
        icon: <HomeIconOption />,
        component: Home,
        showInMenu: true
    },
    {
        path: '/productos',
        title: 'Productos',
        description: 'Gestionar catálogo de productos y precios',
        icon: <CategoryIconOption />,
        component: Productos,
        showInMenu: true
    },
    {
        path: '/pedidos',
        title: 'Pedidos',
        description: 'Administrar pedidos de usuarios y proveedores',
        icon: <ShoppingCartIconOption />,
        component: Pedidos,
        showInMenu: true
    },
    {
        path: '/recepcion',
        title: 'Recepción',
        description: 'Registrar entrada de mercancía al almacén',
        icon: <LoginIconOption />,
        component: Recepcion,
        showInMenu: true
    },
    {
        path: '/inventario',
        title: 'Inventario',
        description: 'Controlar stock y realizar ajustes de inventario',
        icon: <InventoryIconOption />,
        component: Inventario,
        showInMenu: true
    },
    {
        path: '/movimientos',
        title: 'Movimientos',
        description: 'Consultar historial de movimientos de stock',
        icon: <SwapHorizIconOption />,
        component: Movimientos,
        showInMenu: true
    },
    {
        path: '/proveedores',
        title: 'Proveedores',
        description: 'Gestionar información de proveedores externos',
        icon: <LocalShippingIconOption />,
        component: Proveedores,
        showInMenu: true
    },
    {
        path: '/incidencias',
        title: 'Incidencias',
        description: 'Reportar y gestionar problemas o devoluciones',
        icon: <ReportProblemIconOption />,
        component: Incidencias,
        showInMenu: true
    },
    {
        path: '/usuario',
        title: 'Perfil de Usuario',
        description: 'Configurar datos personales y preferencias',
        icon: <PersonIconOption />,
        component: Usuario,
        showInMenu: false
    }
];
