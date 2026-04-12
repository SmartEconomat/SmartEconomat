import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar as MuiAppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer as MuiDrawer,
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
  MenuItem as MuiMenuItem,
  useTheme,
  Theme,
  CSSObject,
  styled,
} from '@mui/material';
import { useBreakpoints } from '../utils/useBreakpoints';
import { Tooltip } from '../components/ui/Tooltip';
import { getTooltipContent } from '../utils/tooltipUtils';
import MenuIcon from '@mui/icons-material/MenuOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import { menuItems } from '../utils/config/menuConfig';
import type { MenuItem as MenuConfigItem } from '../utils/config/menuConfig';
import { useAuth } from '../store/auth.hooks';
import { hasAnyPermission, hasPermission } from '../utils/auth/permissionUtils';
import { useThemeContext } from '../store/theme.hooks';
import { getRoleColor } from '../utils/theme/roleColors';
import SettingsMenu from '../components/common/Settings/SettingsMenu';
import TutorialHelper from '../components/common/Tutorial/TutorialHelper';
import LearningModeToggle from '../components/common/Learning/LearningModeToggle';
import NotificationCenter from '../components/common/Notification/NotificationCenter';
import SkipLinks from '../components/layout/SkipLinks';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import Logo from '../assets/images/SVG/logo-smat-economato.svg';
import LogoBlanco from '../assets/images/SVG/logo-smart-economat-blanco.svg';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
    delay: 50, // Espera a que el texto se desvanezca
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  [theme.breakpoints.down('sm')]: {
    minHeight: '80px !important',
  },
  [theme.breakpoints.up('sm')]: {
    minHeight: '100px !important',
  },
}));

interface AppBarProps extends React.ComponentProps<typeof MuiAppBar> {
  open?: boolean;
  component?: React.ElementType;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  [theme.breakpoints.down('sm')]: {
    zIndex: theme.zIndex.appBar,
    marginLeft: 0,
    width: '100%',
  },
}));

const DesktopDrawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));

export default function MainLayout() {
  const theme = useTheme();
  const { isMobile } = useBreakpoints();
  const { currentThemeName, isLearningMode } = useThemeContext();
  const [open, setOpen] = useState(!isMobile);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Activar atajos de teclado globales
  useKeyboardShortcuts();

  const getLogo = () => {
    if (
      currentThemeName === 'dark' ||
      currentThemeName === 'highContrastDark'
    ) {
      return LogoBlanco;
    }
    return Logo;
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
    navigate('/login');
  };

  const visibleMenuItems = menuItems
    .filter((item) => item.showInMenu)
    .filter((item) => {
      if (item.permiso) {
        return hasPermission(user, item.permiso);
      }
      if (item.anyPermissions && item.anyPermissions.length > 0) {
        return hasAnyPermission(user, item.anyPermissions);
      }
      if (item.roles) {
        const userRole = user?.rol?.toUpperCase() || '';
        return item.roles.map((role) => role.toUpperCase()).includes(userRole);
      }
      return true;
    });

  const groupLabels: Record<MenuConfigItem['group'], string> = {
    inicio: 'Inicio',
    catalogo: 'Catálogo',
    operaciones: 'Operaciones',
    control: 'Control',
    gestion: 'Gestión',
  };

  const drawerContent = (
    <>
      <DrawerHeader sx={{ justifyContent: open ? 'center' : 'center', px: 1 }}>
        {open && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              mr: 1,
            }}
          >
            <Box
              component="img"
              src={getLogo()}
              alt="Smart Economat Logo"
              sx={{
                height: { xs: 60, sm: 80 },
                maxWidth: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>
        )}
        <Tooltip title={open ? 'Minimizar menú' : 'Expandir menú'}>
          <IconButton
            aria-label={open ? 'Minimizar menú' : 'Expandir menú'}
            onClick={open ? handleDrawerClose : handleDrawerOpen}
          >
            {theme.direction === 'rtl' ? (
              open ? (
                <ChevronRightIcon />
              ) : (
                <ChevronLeftIcon />
              )
            ) : open ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </Tooltip>
      </DrawerHeader>
      <Divider />
      <List aria-label="Navegación principal">
        {visibleMenuItems.map((item, index) => {
          const previousGroup =
            index > 0 ? visibleMenuItems[index - 1].group : null;
          const showNewGroup = index === 0 || previousGroup !== item.group;

          return (
            <React.Fragment key={item.path}>
              {index > 0 && showNewGroup && (
                <ListItem disablePadding sx={{ display: 'block' }}>
                  <Divider sx={{ my: open ? 1.5 : 1 }} />
                </ListItem>
              )}

              {open && showNewGroup && item.group !== 'inicio' && (
                <ListItem disablePadding sx={{ display: 'block' }}>
                  <Typography
                    variant="overline"
                    sx={{
                      display: 'block',
                      px: 2.5,
                      pt: index === 0 ? 1 : 0,
                      pb: 0.5,
                      color: 'text.secondary',
                      letterSpacing: '0.08em',
                      fontWeight: 700,
                      opacity: open ? 1 : 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      transition: theme.transitions.create('opacity', {
                        easing: theme.transitions.easing.easeInOut,
                        duration: open
                          ? theme.transitions.duration.standard
                          : 150, // Desvanecimiento ultra-rápido al cerrar
                        delay: open ? 150 : 0, // Retraso al abrir para esperar espacio
                      }),
                    }}
                  >
                    {groupLabels[item.group]}
                  </Typography>
                </ListItem>
              )}

              <ListItem disablePadding sx={{ display: 'block' }}>
                <Tooltip
                  title={getTooltipContent(
                    open,
                    isLearningMode,
                    item.title,
                    item.description
                  )}
                  describeChild
                >
                  <ListItemButton
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                    }}
                    selected={location.pathname === item.path}
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) setOpen(false);
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                        color:
                          location.pathname === item.path
                            ? 'primary.main'
                            : 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      sx={{
                        opacity: open ? 1 : 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        transition: theme.transitions.create('opacity', {
                          easing: theme.transitions.easing.easeInOut,
                          duration: open
                            ? theme.transitions.duration.standard
                            : 150, // Desvanecimiento ultra-rápido al cerrar
                          delay: open ? 250 : 0, // Retraso al abrir para esperar espacio
                        }),
                      }}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>
      <Box sx={{ marginTop: 'auto' }}>
        <Divider />
        <List aria-label="Opciones del sistema">
          <ListItem disablePadding sx={{ display: 'block' }}>
            <TutorialHelper mode="listitem" isOpen={open} />
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <LearningModeToggle mode="listitem" isOpen={open} />
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <SettingsMenu mode="listitem" isOpen={open} />
          </ListItem>
        </List>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <SkipLinks />
      <AppBar 
        position="fixed" 
        open={open} 
        color="inherit" 
        elevation={1}
        component="header"
        role="banner"
        aria-label="Cabecera superior"
      >
        <Toolbar
          sx={{
            minHeight: { xs: '80px !important', sm: '100px !important' },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Tooltip title="Expandir menú">
            <IconButton
              color="inherit"
              aria-label="Expandir menú"
              onClick={handleDrawerOpen}
              edge="start"
              sx={{
                marginRight: 5,
                ...(open && !isMobile && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>

          <Box sx={{ flexGrow: 1 }} />

          <Box
            sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 2 }}
          >
            <NotificationCenter />
            <Typography
              variant="subtitle1"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              {user?.name}
            </Typography>
            <IconButton
              onClick={handleUserMenuOpen}
              sx={{ p: 0 }}
              aria-label="Abrir menú de usuario"
            >
              <Avatar
                sx={{
                  bgcolor: getRoleColor(user?.rol || ''),
                  color: '#ffffff',
                }}
              >
                <PersonIcon />
              </Avatar>
            </IconButton>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={userMenuAnchor}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
            >
              <MuiMenuItem
                onClick={() => {
                  handleUserMenuClose();
                  navigate('/perfil');
                }}
              >
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Mi Perfil</Typography>
              </MuiMenuItem>
              <Divider />
              <MuiMenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Cerrar Sesión</Typography>
              </MuiMenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Conditional Rendering of Drawers */}
      {isMobile ? (
        <MuiDrawer
          variant="temporary"
          open={open}
          onClose={handleDrawerClose}
          component="nav"
          aria-label="Menú principal lateral"
          PaperProps={{
            id: 'sidebar-nav',
            tabIndex: -1,
            sx: { outline: 'none' }
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawerContent}
        </MuiDrawer>
      ) : (
        <DesktopDrawer 
          variant="permanent" 
          open={open}
          component="nav"
          aria-label="Menú principal lateral"
          PaperProps={{
            id: 'sidebar-nav',
            tabIndex: -1,
            sx: { outline: 'none' }
          }}
          sx={{ outline: 'none' }}
        >
          {drawerContent}
        </DesktopDrawer>
      )}

      <Box 
        component="main" 
        id="main-content" 
        role="main"
        aria-label="Contenido principal"
        tabIndex={-1}
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2.5, sm: 3 },
          outline: 'none', // Evitar borde al recibir foco por salto
        }} 
      >
        <DrawerHeader />
        <Outlet />
      </Box>
    </Box>
  );
}
