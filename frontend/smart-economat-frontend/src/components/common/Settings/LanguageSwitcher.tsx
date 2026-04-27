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
import { useAuth } from '../../../store/auth.hooks';

const SUPPORTED_LANGS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
] as const;

type LangCode = (typeof SUPPORTED_LANGS)[number]['code'];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { changeLanguage } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const currentLang = (
    SUPPORTED_LANGS.find((l) => i18n.language?.startsWith(l.code))
      ? i18n.language.slice(0, 2)
      : 'es'
  ) as LangCode;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (code: LangCode) => {
    changeLanguage(code);
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
          sx={{ borderRadius: 1, px: 0.75, py: 0.75 }}
        >
          <LanguageIcon fontSize="medium" />
          <Typography
            component="span"
            variant="caption"
            sx={{
              ml: 0.5,
              fontWeight: 600,
              fontSize: '0.75rem',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            {currentLang}
          </Typography>
          {!isMobile && (
            <KeyboardArrowDownIcon
              fontSize="small"
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
