import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import InventoryIcon from '@mui/icons-material/Inventory';
import HelpIcon from '@mui/icons-material/Help';

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
                title: 'Panel de Inicio',
                description: 'Este es tu centro de control principal. Aquí tendrás una vista rápida del estado de tu economato.'
            },
            {
                icon: <AddShoppingCartIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
                title: 'Accesos Rápidos',
                description: 'Usa las tarjetas de acceso rápido para crear nuevos pedidos o registrar artículos en segundos.'
            },
            {
                icon: <AssessmentIcon sx={{ fontSize: 60, color: 'success.main' }} />,
                title: 'Resumen de Actividad',
                description: 'Mantente al día con las últimas notificaciones y alertas de stock bajo.'
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
    'default': {
        steps: [
            {
                icon: <HelpIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
                title: 'Ayuda General',
                description: 'Navega por el menú lateral para acceder a las diferentes secciones de la aplicación.'
            },
            {
                icon: <SettingsIconWrapper />,
                title: 'Configuración',
                description: 'Personaliza tu experiencia, cambia el tema o gestiona tu perfil desde el menú superior.'
            }
        ]
    }
};


import SettingsIcon from '@mui/icons-material/Settings';
function SettingsIconWrapper() {
    return <SettingsIcon sx={{ fontSize: 60, color: 'action.active' }} />;
}
