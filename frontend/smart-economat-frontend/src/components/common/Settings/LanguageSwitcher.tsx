import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '../../ui/Tooltip';

const SUPPORTED_LANGS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
] as const;

type LangCode = (typeof SUPPORTED_LANGS)[number]['code'];

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentLang = i18n.language?.slice(0, 2) || 'es';

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (code: LangCode) => {
    i18n.changeLanguage(code);
    handleClose();
  };

  return (
    <>
      <Tooltip title={t('language.select')}>
        <IconButton
          color="inherit"
          aria-label={t('language.select')}
          aria-controls={anchorEl ? 'language-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={anchorEl ? 'true' : undefined}
          onClick={handleOpen}
          edge="start"
          sx={{
            borderRadius: 1,
            px: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <LanguageIcon fontSize="medium" color="inherit" />
          <Typography
            component="span"
            variant="subtitle1"
            sx={{
              ml: 1,
              fontWeight: 500,
              textTransform: 'uppercase',
              color: 'inherit',
            }}
          >
            {currentLang}
          </Typography>
          {!isMobile && (
            <KeyboardArrowDownIcon
              fontSize="small"
              color="inherit"
              sx={{
                ml: 0.25,
                transition: 'transform 0.2s',
                transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          )}
        </IconButton>
      </Tooltip>

      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 140, mt: 0.5 } } }}
      >
        {SUPPORTED_LANGS.map(({ code, label }) => (
          <MenuItem
            key={code}
            selected={currentLang === code}
            onClick={() => handleSelect(code)}
          >
            <ListItemText primary={label} />
            {currentLang === code && (
              <ListItemIcon
                sx={{ justifyContent: 'flex-end', minWidth: 0, ml: 1 }}
              >
                <CheckIcon fontSize="small" color="primary" />
              </ListItemIcon>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
