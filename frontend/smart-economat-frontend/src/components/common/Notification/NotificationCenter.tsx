import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import { useNavigate } from 'react-router-dom';
import { useAnyPermission, usePermission } from '../../../store/auth.hooks';
import { PERMISSIONS } from '../../../sherlock-auth/permissions.constants';
import {
  AppNotification,
  fetchAppNotifications,
} from '../../../services/notifications.service';
import { eventBus, UI_EVENTS } from '../../../utils/eventBus';
import Spinner from '../../ui/Spinner';
import { Tooltip } from '../../ui/Tooltip';

const getNotificationIcon = (priority: AppNotification['priority']) =>
  priority === 'urgent' ? (
    <WarningAmberRoundedIcon color="error" fontSize="medium" />
  ) : (
    <PendingActionsRoundedIcon color="warning" fontSize="medium" />
  );

const getNotificationLabel = (priority: AppNotification['priority']) =>
  priority === 'urgent' ? 'Urgente' : 'Pendiente';

export default function NotificationCenter() {
  const theme = useTheme();
  const navigate = useNavigate();
  const canListUsers = usePermission(PERMISSIONS.usuarios.listar);
  const canReviewInventoryNotifications = useAnyPermission([
    PERMISSIONS.inventario.listar,
    PERMISSIONS.inventario.ver,
    'inventario:ver_alertas',
  ]);

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shouldRenderContent, setShouldRenderContent] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!canListUsers && !canReviewInventoryNotifications) {
      setNotifications([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAppNotifications({
        includePendingUsers: canListUsers,
        includeInventoryAlerts: canReviewInventoryNotifications,
      });
      setNotifications(data);
    } catch (err) {
      console.error('Error loading notifications', err);
      setError('No se pudieron cargar las notificaciones.');
    } finally {
      setIsLoading(false);
    }
  }, [canListUsers, canReviewInventoryNotifications]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      void loadNotifications();
    };

    eventBus.on(UI_EVENTS.OPEN_NOTIFICATION_CENTER, handleOpen);
    return () => {
      eventBus.off(UI_EVENTS.OPEN_NOTIFICATION_CENTER, handleOpen);
    };
  }, [loadNotifications]);

  const totalNotifications = useMemo(
    () => notifications.reduce((sum, item) => sum + item.count, 0),
    [notifications]
  );

  const handleOpen = () => {
    setOpen(true);
    void loadNotifications();
  };

  const handleClose = () => {
    setOpen(false);
    // Limpiamos el contenido al cerrar para que la animación de salida sea ligera
    setShouldRenderContent(false);
  };

  // Efecto para diferir el renderizado del contenido hasta que la animación del Drawer comience/avance
  useEffect(() => {
    if (open) {
      // Un pequeño retraso para permitir que el Drawer inicie su animación sin carga de JS/DOM pesada
      const timer = setTimeout(() => setShouldRenderContent(true), 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleNotificationAction = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      <Tooltip title="Abrir centro de notificaciones">
        <IconButton
          id="btn-notifications"
          color="inherit"
          onClick={handleOpen}
          aria-label="Notificaciones"
        >
          <Badge badgeContent={totalNotifications} color="error" max={99}>
            <NotificationsOutlinedIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 420 },
            maxWidth: '100%',
            borderLeft: '1px solid',
            borderColor: 'divider',
            boxShadow: theme.shadows[10], // Usar sombra estándar de MUI (más optimizada)
            bgcolor: 'background.default',
          },
        }}
        ModalProps={{
          sx: {
            zIndex: 9999, // Superponer sobre TODO
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.4)', // Sombreado más ligero
              backdropFilter: 'none', // ELIMINADO: Causa principal de lag en animaciones
            },
          },
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'transparent', // No debe tapar el sombreado del Drawer
          }}
        >
          {/* Header Premium */}
          <Box
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              background: 'transparent', // Sin brillo ni gradientes
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" fontWeight={800} color="text.primary">
                  Notificaciones
                </Typography>
                <Badge
                  badgeContent={totalNotifications}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontWeight: 700,
                      position: 'relative',
                      transform: 'none',
                      ml: 1,
                    },
                  }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Tareas y alertas que requieren tu atención.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Actualizar">
                <IconButton
                  size="small"
                  onClick={() =>
                    void fetchAppNotifications({
                      includePendingUsers: canListUsers,
                      includeInventoryAlerts: canReviewInventoryNotifications,
                      forceRefresh: true,
                    })
                      .then((data) => {
                        setNotifications(data);
                        setError(null);
                      })
                      .catch((err) => {
                        console.error('Error loading notifications', err);
                        setError('No se pudieron cargar las notificaciones.');
                      })
                  }
                  aria-label="Actualizar notificaciones"
                  sx={{
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <RefreshRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                onClick={handleClose}
                aria-label="Cerrar panel de notificaciones"
                sx={{
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'error.50', color: 'error.main' },
                }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          <Box
            sx={{
              p: 2.5,
              flexGrow: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {!shouldRenderContent ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Spinner size="sm" />
              </Box>
            ) : isLoading ? (
              <Box
                sx={{
                  height: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <Spinner size="md" />
                <Typography variant="caption" color="text.secondary">
                  Buscando actualizaciones...
                </Typography>
              </Box>
            ) : error ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: 'error.50',
                  borderColor: 'error.light',
                  textAlign: 'center',
                }}
              >
                <Typography color="error.main" fontWeight={700} mb={1}>
                  Hubo un problema
                </Typography>
                <Typography variant="body2" color="error.dark">
                  {error}
                </Typography>
              </Paper>
            ) : notifications.length === 0 ? (
              <Box
                sx={{
                  mt: 8,
                  px: 4,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'background.paper', // Highlighted in white
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                >
                  <CelebrationRoundedIcon
                    color="success"
                    sx={{ fontSize: 40 }}
                  />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  ¡Todo bajo control!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No tienes acciones urgentes ni tareas pendientes en este
                  momento. Buen trabajo.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {notifications.map((notification) => (
                  <Paper
                    key={notification.id}
                    elevation={0}
                    onClick={() =>
                      handleNotificationAction(notification.actionPath)
                    }
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor:
                        notification.priority === 'urgent'
                          ? 'error.light'
                          : 'divider',
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px -12px rgba(0,0,0,0.12)',
                        '& .action-icon': {
                          transform: 'translateX(4px)',
                          color: 'primary.main',
                        },
                      },
                    }}
                  >
                    {notification.priority === 'urgent' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: 4,
                          height: '100%',
                          bgcolor: 'error.main',
                        }}
                      />
                    )}

                    <Stack spacing={2}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              bgcolor:
                                notification.priority === 'urgent'
                                  ? 'error.50'
                                  : 'warning.50',
                              display: 'flex',
                            }}
                          >
                            {getNotificationIcon(notification.priority)}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={800}>
                              {notification.title}
                            </Typography>
                            <Chip
                              label={getNotificationLabel(
                                notification.priority
                              )}
                              size="small"
                              color={
                                notification.priority === 'urgent'
                                  ? 'error'
                                  : 'warning'
                              }
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                mt: 0.5,
                              }}
                            />
                          </Box>
                        </Stack>
                        <ChevronRightRoundedIcon
                          className="action-icon"
                          sx={{
                            color: 'action.active',
                            transition: 'transform 0.2s, color 0.2s',
                          }}
                        />
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mb={1}
                        >
                          {notification.description}
                        </Typography>
                        {notification.details &&
                          notification.details.length > 0 && (
                            <Stack
                              spacing={0.5}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: 'action.hover',
                                border: '1px dashed',
                                borderColor: 'divider',
                              }}
                            >
                              {notification.details.map((detail) => (
                                <Typography
                                  key={detail}
                                  variant="caption"
                                  color="text.primary"
                                  fontWeight={500}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 4,
                                      height: 4,
                                      borderRadius: '50%',
                                      bgcolor: 'primary.main',
                                    }}
                                  />
                                  {detail}
                                </Typography>
                              ))}
                            </Stack>
                          )}
                      </Box>

                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          Total pendientes: {notification.count}
                        </Typography>
                        <Button
                          size="small"
                          variant="text"
                          endIcon={<ChevronRightRoundedIcon />}
                          sx={{
                            fontWeight: 700,
                            textTransform: 'none',
                            borderRadius: 2,
                          }}
                        >
                          {notification.actionLabel}
                        </Button>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
