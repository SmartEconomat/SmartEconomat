import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

export default function NotificationCenter() {
  const navigate = useNavigate();
  const canListUsers = usePermission(PERMISSIONS.usuarios.listar);
  const canReviewInventoryNotifications = useAnyPermission([
    PERMISSIONS.inventario.listar,
    PERMISSIONS.inventario.ver,
    'inventario:ver_alertas',
  ]);

  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      setError(t('notifications.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [canListUsers, canReviewInventoryNotifications, t]);

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
  };

  const handleNotificationAction = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      <Tooltip title={t('notifications.openCenter')}>
        <IconButton
          color="inherit"
          onClick={handleOpen}
          aria-label={t('notifications.title')}
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
            boxShadow: '0 0 40px rgba(0,0,0,0.1)',
            bgcolor: 'grey.100', // Sombreado de fondo REAL
          },
        }}
        ModalProps={{
          sx: {
            zIndex: 9999, // Superponer sobre TODO
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.6)', // Sombrear mucho más fuerte el fondo
              backdropFilter: 'blur(2px)', // Añadir un poco de desenfoque al fondo
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
                  {t('notifications.title')}
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
                {t('notifications.subtitle')}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title={t('notifications.refresh')}>
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
                        setError(t('notifications.loadError'));
                      })
                  }
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
            {isLoading ? (
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
                  {t('notifications.loading')}
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
                  {t('notifications.errorTitle')}
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
                  {t('notifications.allClear')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('notifications.allClearDesc')}
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
                              label={t(
                                `notifications.priority.${notification.priority}`,
                                {
                                  defaultValue:
                                    notification.priority === 'urgent'
                                      ? 'Urgente'
                                      : 'Pendiente',
                                }
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
                          {t('notifications.totalPending', {
                            count: notification.count,
                          })}
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
