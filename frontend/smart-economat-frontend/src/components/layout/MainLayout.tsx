import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Box,
    CssBaseline,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Avatar,
    Menu,
    MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/MenuOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import { menuItems } from '../../config/menuConfig';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';
import SettingsMenu from './SettingsMenu';
import Logo from '../../assets/images/SVG/logo-smat-economato.svg';
import LogoBlanco from '../../assets/images/SVG/logo-smart-economat-blanco.svg';
import LogoNegro from '../../assets/images/SVG/logo-smart-economat-negro.svg';

const drawerWidth = 240;

interface Props {
    window?: () => Window;
}

export default function MainLayout(props: Props) {
    const { window } = props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { currentThemeName } = useThemeContext();

    const getPageTitle = (pathname: string) => {
        const item = menuItems.find(item => item.path === pathname);
        return item ? item.title : 'SmartEconomat';
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleLogout = () => {
        handleCloseUserMenu();
        logout();
        navigate('/login');
    };

    const drawer = (
        <div>
            <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
                <Box
                    component="img"
                    src={currentThemeName === 'dark' || currentThemeName === 'highContrastDark' ? LogoBlanco : currentThemeName === 'highContrastLight' ? LogoNegro : Logo}
                    alt="SmartEconomat Logo"
                    sx={{
                        height: 80,
                        width: 'auto',
                        maxWidth: '100%'
                    }}
                />
            </Toolbar>
            <Divider />
            <List>
                {menuItems.filter(item => item.showInMenu).map((item) => (
                    <ListItem key={item.title} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => navigate(item.path)}
                            sx={{
                                '&.Mui-selected': {
                                    color: 'primary.main',
                                    '& .MuiListItemIcon-root': {
                                        color: 'primary.main',
                                    },
                                    '& .MuiTypography-root': {
                                        color: 'primary.main',
                                        fontWeight: 'bold',
                                    },
                                }
                            }}
                        >
                            <ListItemIcon>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.title} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar sx={{ py: 2, minHeight: 112 }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h4" noWrap component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', height: 80, fontWeight: 500 }}>
                        {getPageTitle(location.pathname)}
                    </Typography>

                    <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <SettingsMenu />
                        <Typography variant="subtitle1" sx={{ display: { xs: 'none', sm: 'block' } }}>
                            {user?.name}
                        </Typography>
                        <IconButton onClick={handleOpenUserMenu} sx={{ p: 1 }}>
                            <Avatar alt={user?.name} src="/static/images/avatar/2.jpg" />
                        </IconButton>
                        <Menu
                            sx={{ mt: '45px' }}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                        >
                            <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/usuario'); }}>
                                <ListItemIcon>
                                    <PersonIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography textAlign="center">Perfil</Typography>
                            </MenuItem>
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon>
                                    <LogoutIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography textAlign="center">Cerrar Sesión</Typography>
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>


            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                <Drawer
                    container={container}
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
            >
                <Toolbar sx={{ mb: 6 }} />
                <Outlet />
            </Box>
        </Box>
    );
}
