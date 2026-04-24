import React, { useState, useCallback } from 'react';
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
import PersonIcon from '@mui/icons-material/PersonOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import { menuItems } from '../utils/config/menuConfig';
import { useAuth } from '../store/auth.hooks';
import { hasAnyPermission, hasPermission } from '../utils/auth/permissionUtils';
import { useThemeContext } from '../store/theme.hooks';
import { getRoleColor } from '../utils/theme/roleColors';
import SettingsMenu from '../components/common/Settings/SettingsMenu';
import TutorialHelper from '../components/common/Tutorial/TutorialHelper';
import LearningModeToggle from '../components/common/Learning/LearningModeToggle';
import NotificationCenter from '../components/common/Notification/NotificationCenter';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSidebar } from '../store/sidebar.hooks';
import InteractiveTour from '../components/common/Tutorial/InteractiveTour';
import Logo from '../assets/images/SVG/logo-smat-economato.svg';
import LogoBlanco from '../assets/images/SVG/logo-smart-economat-blanco.svg';
import Favicon from '../assets/icons/SVG/favicon.svg';
import FaviconInv from '../assets/icons/SVG/favicon-inv.svg';

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
  padding: theme.spacing(0, 2),
  ...theme.mixins.toolbar,
  [theme.breakpoints.down('sm')]: {
    minHeight: '64px !important',
  },
  [theme.breakpoints.up('sm')]: {
    minHeight: '76px !important',
  },
}));

interface AppBarProps extends React.ComponentProps<typeof MuiAppBar> {
  open?: boolean;
  component?: React.ElementType;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => {
  const miniWidth = `calc(${theme.spacing(8)} + 1px)`;

  return {
    // Bajamos zIndex al mínimo estándar para que los drawers (especialmente el overlay) reinen
    zIndex: theme.zIndex.appBar,
    transition: theme.transitions.create(['width', 'left'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    left: miniWidth,
    width: `calc(100% - ${miniWidth})`,
    backgroundColor: theme.palette.background.paper,
    // Pointer events: none en el contenedor raíz para TOTAL transparencia en la zona izquierda
    pointerEvents: 'none',
    '& > *': {
      pointerEvents: 'auto',
    },
    ...(open && {
      left: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(['width', 'left'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
    [theme.breakpoints.down('sm')]: {
      zIndex: theme.zIndex.appBar,
      marginLeft: 0,
      left: 0,
      width: '100%',
      pointerEvents: 'auto',
    },
  };
});

const DesktopDrawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  zIndex: theme.zIndex.drawer, // 1200
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));

interface SidebarContentProps {
  isExpanded: boolean;
  onNavigate: (path: string) => void;
  onClose?: () => void;
  isTablet?: boolean;
  isLearningMode?: boolean;
  currentThemeName?: string;
  location?: { pathname: string };
  theme?: Theme;
  visibleMenuItems?: Array<{
    path: string;
    title: string;
    description: string;
    group: 'inicio' | 'catalogo' | 'operaciones' | 'control' | 'gestion';
    icon?: React.ReactNode;
  }>;
}

const SidebarContent = React.memo(
  ({
    isExpanded,
    onNavigate,
    isLearningMode,
    currentThemeName,
    location,
    theme,
    visibleMenuItems,
  }: SidebarContentProps) => {
    if (!theme || !location || !visibleMenuItems) {
      return null;
    }

    const getLogo = (isMini = false) => {
      const isDark =
        currentThemeName === 'dark' || currentThemeName === 'highContrastDark';
      if (isMini) {
        return isDark ? FaviconInv : Favicon;
      }
      return isDark ? LogoBlanco : Logo;
    };

    const groupLabels: Record<
      'inicio' | 'catalogo' | 'operaciones' | 'control' | 'gestion',
      string
    > = {
      inicio: 'Inicio',
      catalogo: 'Catálogo',
      operaciones: 'Operaciones',
      control: 'Control',
      gestion: 'Gestión',
    };

    return (
      <>
        <DrawerHeader
          sx={{ justifyContent: 'center', alignItems: 'center', px: 0 }}
        >
          {isExpanded ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <Box
                component="img"
                src={getLogo(false)}
                alt="Smart Economat Logo"
                sx={{
                  height: { xs: 52, sm: 64 },
                  maxWidth: '80%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <Box
                component="img"
                src={getLogo(true)}
                alt="Favicon"
                sx={{
                  height: 36,
                  width: 36,
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}
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
                    <Divider sx={{ my: isExpanded ? 1.5 : 1 }} />
                  </ListItem>
                )}

                {isExpanded && showNewGroup && item.group !== 'inicio' && (
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
                        opacity: isExpanded ? 1 : 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        transition: theme.transitions.create('opacity', {
                          easing: theme.transitions.easing.easeInOut,
                          duration: isExpanded
                            ? theme.transitions.duration.standard
                            : 150,
                          delay: isExpanded ? 150 : 0,
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
                      isExpanded,
                      isLearningMode || false,
                      item.title,
                      item.description
                    )}
                    describeChild
                  >
                    <ListItemButton
                      sx={{
                        minHeight: 48,
                        justifyContent: isExpanded ? 'initial' : 'center',
                        px: 2.5,
                        borderRadius: isExpanded ? 0 : '10px',
                        mx: isExpanded ? 0 : 1,
                        mb: isExpanded ? 0 : 0.5,
                      }}
                      selected={location.pathname === item.path}
                      onClick={() => onNavigate(item.path)}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: isExpanded ? 3 : 0,
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
                          display: isExpanded ? 'block' : 'none',
                          opacity: isExpanded ? 1 : 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          transition: theme.transitions.create('opacity', {
                            easing: theme.transitions.easing.easeInOut,
                            duration: isExpanded
                              ? theme.transitions.duration.standard
                              : 150,
                            delay: isExpanded ? 250 : 0,
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
              <TutorialHelper mode="listitem" isOpen={isExpanded} />
            </ListItem>
            <ListItem disablePadding sx={{ display: 'block' }}>
              <LearningModeToggle mode="listitem" isOpen={isExpanded} />
            </ListItem>
            <ListItem disablePadding sx={{ display: 'block' }}>
              <SettingsMenu mode="listitem" isOpen={isExpanded} />
            </ListItem>
          </List>
        </Box>
      </>
    );
  }
);

SidebarContent.displayName = 'SidebarContent';

export default function MainLayout() {
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop, isLargeDesktop, isXLarge } =
    useBreakpoints();
  const isDesktopMode = isLargeDesktop || isXLarge; // >= 1200px
  const { currentThemeName, isLearningMode } = useThemeContext();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Usar contexto global para el sidebar
  const {
    isExpanded: sidebarExpanded,
    setIsExpanded: setSidebarExpanded,
    toggleSidebar: handleSidebarToggle,
  } = useSidebar();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  // Activar atajos de teclado globales
  useKeyboardShortcuts();

  // Cerrar sidebar overlay automáticamente al cambiar de ruta (solo en modo overlay)
  React.useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  React.useEffect(() => {
    if (isDesktopMode) {
      setSidebarExpanded(true);
    } else if (isTablet || isDesktop) {
      setSidebarExpanded(false);
    }
  }, [isDesktopMode, isTablet, isDesktop, setSidebarExpanded]);

  const handleMobileDrawerOpen = () => {
    setMobileOpen(true);
  };

  const handleMobileDrawerClose = () => {
    setMobileOpen(false);
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

  const handleNavigation = useCallback(
    (path: string) => {
      navigate(path);
      // Cerrar sidebar overlay en mobile y tablet al navegar
      if (isMobile) {
        setMobileOpen(false);
      }
      if (isTablet || isDesktop) {
        setSidebarExpanded(false);
      }
    },
    [navigate, isMobile, isTablet, isDesktop, setSidebarExpanded]
  );

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

  /**
   * Componente interno para renderizar el contenido del menú lateral.
   * Props necesarios para cada caso de uso.
   */
  const renderSidebarContent = (isExpanded: boolean) => (
    <SidebarContent
      isExpanded={isExpanded}
      onNavigate={handleNavigation}
      isLearningMode={isLearningMode}
      currentThemeName={currentThemeName}
      location={location}
      theme={theme}
      visibleMenuItems={visibleMenuItems}
    />
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* <SkipLinks id="skip-links" /> - Comentado temporalmente por depuración de clics */}
      <InteractiveTour />
      <AppBar
        position="fixed"
        open={!isMobile && sidebarExpanded}
        color="inherit"
        elevation={1}
        component="header"
        role="banner"
        aria-label="Cabecera superior"
      >
        <Toolbar
          sx={{
            minHeight: { xs: '64px !important', sm: '76px !important' },
            px: { xs: 2, sm: 3 },
          }}
        >
          {/* Mobile/Tablet: Menu toggle | Desktop: Toggle expand/collapse */}
          <Tooltip
            title={
              isMobile
                ? 'Abrir menú'
                : sidebarExpanded
                  ? 'Minimizar menú'
                  : 'Expandir menú'
            }
          >
            <IconButton
              color="inherit"
              aria-label={
                isMobile
                  ? 'Abrir menú'
                  : sidebarExpanded
                    ? 'Minimizar menú'
                    : 'Expandir menú'
              }
              onClick={isMobile ? handleMobileDrawerOpen : handleSidebarToggle}
              edge="start"
              sx={{
                marginRight: 5,
              }}
            >
              {isMobile ? (
                <MenuIcon />
              ) : sidebarExpanded ? (
                <ChevronLeftIcon />
              ) : (
                <MenuIcon />
              )}
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
              id="user-menu-button"
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
          open={mobileOpen}
          onClose={handleMobileDrawerClose}
          component="nav"
          aria-label="Menú principal lateral"
          PaperProps={{
            id: 'sidebar-nav',
            tabIndex: -1,
            sx: {
              outline: 'none',
              boxShadow: 'none',
              border: 'none',
              '&:focus': {
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
              },
              '&:focus-visible': {
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
              },
            },
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {renderSidebarContent(true)}
        </MuiDrawer>
      ) : (
        <DesktopDrawer
          variant="permanent"
          open={sidebarExpanded}
          component="nav"
          aria-label="Menú principal lateral"
          PaperProps={{
            id: 'sidebar-nav',
            tabIndex: -1,
            sx: { outline: 'none' },
          }}
          sx={{ outline: 'none' }}
        >
          {renderSidebarContent(sidebarExpanded)}
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
