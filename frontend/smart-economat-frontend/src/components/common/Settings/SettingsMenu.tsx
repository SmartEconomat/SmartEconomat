import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  ListItemButton,
} from '@mui/material';
import { Tooltip } from '../../ui/Tooltip';
import { getTooltipContent } from '../../../utils/tooltipUtils';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import ContrastIcon from '@mui/icons-material/ContrastOutlined';
import InvertColorsIcon from '@mui/icons-material/InvertColorsOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { useThemeContext } from '../../../store/theme.hooks';
import { useTranslation } from 'react-i18next';

/**
 * Props for the SettingsMenu component.
 */
interface SettingsMenuProps {
  /** Display mode: 'icon' renders a standalone icon button, 'listitem' renders a sidebar list item. */
  mode?: 'icon' | 'listitem';
  /** Whether the sidebar drawer is currently open (affects label visibility in listitem mode). */
  isOpen?: boolean;
}

/**
 * Settings dropdown menu that allows the user to change the application
 * theme and font size.
 *
 * In `listitem` mode the trigger is a MUI ListItemButton suitable for a
 * navigation drawer. In `icon` mode the trigger is a small IconButton
 * typically placed in a top app-bar.
 *
 * @param props - {@link SettingsMenuProps}
 */
export default function SettingsMenu({
  mode = 'icon',
  isOpen = true,
}: SettingsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { currentThemeName, setTheme, fontSize, setFontSize, isLearningMode } =
    useThemeContext();
  const { t } = useTranslation();
  const open = Boolean(anchorEl);

  /**
   * Opens the settings dropdown menu.
   * @param event - The click event from the trigger element.
   */
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  /**
   * Closes the settings dropdown menu.
   */
  const handleClose = () => {
    setAnchorEl(null);
  };

  /**
   * Applies the selected theme and closes the menu.
   * @param theme - The theme identifier to apply.
   */
  const handleThemeChange = (
    theme: 'light' | 'dark' | 'highContrastLight' | 'highContrastDark'
  ) => {
    setTheme(theme);
    handleClose();
  };

  if (mode === 'listitem') {
    return (
      <>
        <Tooltip
          title={getTooltipContent(
            isOpen,
            isLearningMode,
            t('configuracion.titulo'),
            t('configuracion.descripcion')
          )}
        >
          <ListItemButton
            onClick={handleClick}
            aria-controls={open ? 'settings-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            sx={{
              minHeight: 48,
              justifyContent: isOpen ? 'initial' : 'center',
              px: 2.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: isOpen ? 3 : 'auto',
                justifyContent: 'center',
              }}
            >
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary={t('configuracion.titulo')}
              sx={{ opacity: isOpen ? 1 : 0 }}
            />
          </ListItemButton>
        </Tooltip>
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
              ml: 6, // Ajuste para sidebar
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
                left: 14, // Arrow left for sidebar
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'left', vertical: 'bottom' }} // Open to right/bottom
          anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        >
          {/* Menu Items (Same) */}
          <MenuItem disabled>
            <Typography variant="subtitle2" color="text.secondary">
              {t('configuracion.tema')}
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleThemeChange('light')}>
            <ListItemIcon>
              <LightModeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('configuracion.temaClaro')}</ListItemText>
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
            <ListItemText>{t('configuracion.temaOscuro')}</ListItemText>
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
            <ListItemText>{t('configuracion.temaAltoClaroContraste')}</ListItemText>
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
            <ListItemText>{t('configuracion.temaAltoOscuroContraste')}</ListItemText>
            {currentThemeName === 'highContrastDark' && (
              <Typography variant="body2" color="text.secondary">
                <CheckIcon fontSize="small" />
              </Typography>
            )}
          </MenuItem>
          <Divider />
          <MenuItem disabled>
            <Typography variant="subtitle2" color="text.secondary">
              {t('configuracion.tamanoFuente')}
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              setFontSize('small');
              handleClose();
            }}
          >
            <ListItemIcon>
              <Typography variant="body2" sx={{ fontSize: 12 }}>
                A
              </Typography>
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 12 }}>
              {t('configuracion.fuente.pequeno')}
            </ListItemText>
            {fontSize === 'small' && (
              <CheckIcon
                fontSize="small"
                sx={{ ml: 2, color: 'text.secondary' }}
              />
            )}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setFontSize('medium');
              handleClose();
            }}
          >
            <ListItemIcon>
              <Typography variant="body2" sx={{ fontSize: 14 }}>
                A
              </Typography>
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 14 }}>
              {t('configuracion.fuente.mediano')}
            </ListItemText>
            {fontSize === 'medium' && (
              <CheckIcon
                fontSize="small"
                sx={{ ml: 2, color: 'text.secondary' }}
              />
            )}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setFontSize('large');
              handleClose();
            }}
          >
            <ListItemIcon>
              <Typography variant="body2" sx={{ fontSize: 16 }}>
                A
              </Typography>
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 16 }}>
              {t('configuracion.fuente.grande')}
            </ListItemText>
            {fontSize === 'large' && (
              <CheckIcon
                fontSize="small"
                sx={{ ml: 2, color: 'text.secondary' }}
              />
            )}
          </MenuItem>
        </Menu>
      </>
    );
  }

  return (
    <>
      <Tooltip
        title={getTooltipContent(
          false,
          isLearningMode,
          t('configuracion.ajustes'),
          t('configuracion.titulo')
        )}
        placement="bottom"
      >
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ ml: 2, color: 'white' }}
          aria-controls={open ? 'settings-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>
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
            {t('configuracion.tema')}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleThemeChange('light')}>
          <ListItemIcon>
            <LightModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('configuracion.temaClaro')}</ListItemText>
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
          <ListItemText>{t('configuracion.temaOscuro')}</ListItemText>
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
          <ListItemText>{t('configuracion.temaAltoClaroContraste')}</ListItemText>
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
          <ListItemText>{t('configuracion.temaAltoOscuroContraste')}</ListItemText>
          {currentThemeName === 'highContrastDark' && (
            <Typography variant="body2" color="text.secondary">
              <CheckIcon fontSize="small" />
            </Typography>
          )}
        </MenuItem>
        <Divider />
        <MenuItem disabled>
          <Typography variant="subtitle2" color="text.secondary">
            {t('configuracion.tamanoFuente')}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setFontSize('small');
            handleClose();
          }}
        >
          <ListItemIcon>
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              A
            </Typography>
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: 12 }}>
            {t('configuracion.fuente.pequeno')}
          </ListItemText>
          {fontSize === 'small' && (
            <CheckIcon
              fontSize="small"
              sx={{ ml: 2, color: 'text.secondary' }}
            />
          )}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setFontSize('medium');
            handleClose();
          }}
        >
          <ListItemIcon>
            <Typography variant="body2" sx={{ fontSize: 14 }}>
              A
            </Typography>
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: 14 }}>
            {t('configuracion.fuente.mediano')}
          </ListItemText>
          {fontSize === 'medium' && (
            <CheckIcon
              fontSize="small"
              sx={{ ml: 2, color: 'text.secondary' }}
            />
          )}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setFontSize('large');
            handleClose();
          }}
        >
          <ListItemIcon>
            <Typography variant="body2" sx={{ fontSize: 16 }}>
              A
            </Typography>
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: 16 }}>
            {t('configuracion.fuente.grande')}
          </ListItemText>
          {fontSize === 'large' && (
            <CheckIcon
              fontSize="small"
              sx={{ ml: 2, color: 'text.secondary' }}
            />
          )}
        </MenuItem>
      </Menu>
    </>
  );
}
