import React from 'react';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import InventoryIcon from '@mui/icons-material/Inventory';
import HelpIcon from '@mui/icons-material/Help';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';

export interface TutorialStep {
    icon: React.ReactNode;
    title: string;
    description: string;
}

export interface TutorialConfigItem {
    steps: TutorialStep[];
}

export const tutorialConfig: Record<string, TutorialConfigItem> = {
    '/': {
        steps: [
            {
                icon: <DashboardIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
                title: 'Estadísticas Principales',
                description: 'Resumen en tiempo real de productos, pedidos pendientes e incidencias activas.'
            },
            {
                icon: <ReportProblemIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
                title: 'Alertas de Stock',
                description: 'Control visual de los productos que requieren reposición inmediata.'
            },
            {
                icon: <NotificationsIcon sx={{ fontSize: 60, color: 'info.main' }} />,
                title: 'Notificaciones',
                description: 'Buzón de avisos y eventos importantes detectados por el sistema.'
            },
            {
                icon: <AddShoppingCartIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
                title: 'Acciones Rápidas',
                description: 'Accesos directos para las tareas constantes: Pedidos, Productos, Recepciones y Recetas.'
            },
            {
                icon: <SwapHorizIcon sx={{ fontSize: 60, color: 'success.main' }} />,
                title: 'Actividad Reciente',
                description: 'Historial completo de las últimas operaciones realizadas en el economato.'
            }
        ]
    },
    '/productos': {
        steps: [
            {
                icon: <CategoryIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
                title: 'Catálogo de Productos',
                description: 'Gestiona todos los artículos disponibles. Puedes añadir nuevos productos o editar los existentes.'
            },
            {
                icon: <QrCodeScannerIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
                title: 'Filtros y Búsqueda',
                description: 'Busca productos por nombre, marca o código de barras. También puedes filtrar por alérgenos y categorías.'
            }
        ]
    },
    '/pedidos': {
        steps: [
            {
                icon: <ShoppingCartIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
                title: 'Gestión de Pedidos',
                description: 'Realiza el seguimiento de todos los pedidos realizados, tanto a proveedores como internos.'
            },
            {
                icon: <AssessmentIcon sx={{ fontSize: 60, color: 'info.main' }} />,
                title: 'Estados del Pedido',
                description: 'Controla si un pedido está pendiente, parcial o completado para mantener el flujo de trabajo.'
            }
        ]
    },
    '/recepcion': {
        steps: [
            {
                icon: <QrCodeScannerIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
                title: 'Recepción de Mercancía',
                description: 'Gestiona la entrada de productos al almacén de manera eficiente.'
            },
            {
                icon: <QrCodeScannerIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
                title: 'Escaneo de Códigos',
                description: 'Usa el lector de códigos de barras para identificar productos rápidamente y evitar errores.'
            }
        ]
    },
    '/inventario': {
        steps: [
            {
                icon: <InventoryIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
                title: 'Gestión de Inventario',
                description: 'Consulta el stock actual de todos tus productos en tiempo real.'
            },
            {
                icon: <AssessmentIcon sx={{ fontSize: 60, color: 'info.main' }} />,
                title: 'Ajustes y Filtros',
                description: 'Realiza ajustes manuales y filtra por categorías para encontrar lo que buscas.'
            }
        ]
    },
    '/movimientos': {
        steps: [
            {
                icon: <SwapHorizIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
                title: 'Historial de Movimientos',
                description: 'Revisa todas las entradas, salidas y ajustes realizados en el stock.'
            }
        ]
    },
    '/proveedores': {
        steps: [
            {
                icon: <LocalShippingIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
                title: 'Directorio de Proveedores',
                description: 'Mantén organizada la información de contacto y los productos que suministra cada proveedor.'
            }
        ]
    },
    '/recetas': {
        steps: [
            {
                icon: <MenuBookIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
                title: 'Recetas y Escandallos',
                description: 'Calcula los costes de tus platos y gestiona los ingredientes necesarios para cada receta.'
            }
        ]
    },
    '/incidencias': {
        steps: [
            {
                icon: <ReportProblemIcon sx={{ fontSize: 60, color: 'error.main' }} />,
                title: 'Reporte de Incidencias',
                description: 'Registra cualquier problema con la mercancía, mermas o devoluciones de forma rápida.'
            }
        ]
    },
    '/usuarios': {
        steps: [
            {
                icon: <PeopleIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
                title: 'Gestión de Usuarios',
                description: 'Administra los roles y permisos de profesores, alumnos y personal administrativo.'
            }
        ]
    },
    '/perfil': {
        steps: [
            {
                icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
                title: 'Mi Perfil',
                description: 'Actualiza tus datos personales y cambia tu contraseña cuando lo necesites.'
            }
        ]
    },
    'default': {
        steps: [
            {
                icon: <HelpIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
                title: 'Ayuda General',
                description: 'Navega por el menú lateral para acceder a las diferentes secciones de la aplicación.'
            },
            {
                icon: <SettingsIcon sx={{ fontSize: 60, color: 'action.active' }} />,
                title: 'Configuración',
                description: 'Personaliza tu experiencia, cambia el tema o gestiona tu perfil desde el menú superior.'
            }
        ]
    }
};
