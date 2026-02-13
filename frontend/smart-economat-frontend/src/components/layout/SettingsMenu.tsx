import React, { useState } from 'react';
import {
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import ContrastIcon from '@mui/icons-material/ContrastOutlined';
import InvertColorsIcon from '@mui/icons-material/InvertColorsOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { useThemeContext } from '../../context/ThemeContext';

export default function SettingsMenu() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { currentThemeName, setTheme, fontSize, setFontSize } = useThemeContext();
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleThemeChange = (theme: 'light' | 'dark' | 'highContrastLight' | 'highContrastDark') => {
        setTheme(theme);
        handleClose();
    };

    return (
        <>
            <IconButton
                onClick={handleClick}
                size="small"
                sx={{ ml: 2, color: 'white' }}
                aria-controls={open ? 'settings-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                title="Configuración"
            >
                <SettingsIcon />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                id="settings-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                        '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem disabled>
                    <Typography variant="subtitle2" color="text.secondary">
                        Tema
                    </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleThemeChange('light')}>
                    <ListItemIcon>
                        <LightModeIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Claro</ListItemText>
                    {currentThemeName === 'light' && (
                        <Typography variant="body2" color="text.secondary">
                            <CheckIcon fontSize="small" />
                        </Typography>
                    )}
                </MenuItem>
                <MenuItem onClick={() => handleThemeChange('dark')}>
                    <ListItemIcon>
                        <DarkModeIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Oscuro</ListItemText>
                    {currentThemeName === 'dark' && (
                        <Typography variant="body2" color="text.secondary">
                            <CheckIcon fontSize="small" />
                        </Typography>
                    )}
                </MenuItem>
                <MenuItem onClick={() => handleThemeChange('highContrastLight')}>
                    <ListItemIcon>
                        <ContrastIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Alto Contraste (Claro)</ListItemText>
                    {currentThemeName === 'highContrastLight' && (
                        <Typography variant="body2" color="text.secondary">
                            <CheckIcon fontSize="small" />
                        </Typography>
                    )}
                </MenuItem>
                <MenuItem onClick={() => handleThemeChange('highContrastDark')}>
                    <ListItemIcon>
                        <InvertColorsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Alto Contraste (Oscuro)</ListItemText>
                    {currentThemeName === 'highContrastDark' && (
                        <Typography variant="body2" color="text.secondary">
                            <CheckIcon fontSize="small" />
                        </Typography>
                    )}
                </MenuItem>
                <Divider />
                <MenuItem disabled>
                    <Typography variant="subtitle2" color="text.secondary">
                        Tamaño de Fuente
                    </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setFontSize('small'); handleClose(); }}>
                    <ListItemIcon>
                        <Typography variant="body2" sx={{ fontSize: 12 }}>A</Typography>
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 12 }}>Pequeño</ListItemText>
                    {fontSize === 'small' && <CheckIcon fontSize="small" sx={{ ml: 2, color: 'text.secondary' }} />}
                </MenuItem>
                <MenuItem onClick={() => { setFontSize('medium'); handleClose(); }}>
                    <ListItemIcon>
                        <Typography variant="body2" sx={{ fontSize: 14 }}>A</Typography>
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14 }}>Mediano</ListItemText>
                    {fontSize === 'medium' && <CheckIcon fontSize="small" sx={{ ml: 2, color: 'text.secondary' }} />}
                </MenuItem>
                <MenuItem onClick={() => { setFontSize('large'); handleClose(); }}>
                    <ListItemIcon>
                        <Typography variant="body2" sx={{ fontSize: 16 }}>A</Typography>
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 16 }}>Grande</ListItemText>
                    {fontSize === 'large' && <CheckIcon fontSize="small" sx={{ ml: 2, color: 'text.secondary' }} />}
                </MenuItem>
            </Menu>
        </>
    );
}
