import { createTheme, Theme } from '@mui/material/styles';

export type ThemeName =
  | 'light'
  | 'dark'
  | 'highContrastLight'
  | 'highContrastDark';
export interface ProductoFiltros {
  categoria?: string;
  stockBajo?: boolean;
}
export type FontSize = 'small' | 'medium' | 'large';

const getFontSize = (size: FontSize) => {
  switch (size) {
    case 'small':
      return 12;
    case 'medium':
      return 14;
    case 'large':
      return 16;
    default:
      return 14;
  }
};

const getTypography = (fontSize: FontSize) => ({
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),
  fontSize: getFontSize(fontSize),
});

const lightPalette = {
  mode: 'light' as const,
  primary: {
    main: '#dc004e',
  },
  secondary: {
    main: '#0a6151',
  },
  background: {
    default: '#f5f5f5',
  },
};

const darkPalette = {
  mode: 'dark' as const,
  primary: {
    main: '#ff4081',
  },
  secondary: {
    main: '#4db6ac',
  },
  background: {
    default: '#0B0E14',
    paper: '#161B22',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.85)',
    disabled: 'rgba(255, 255, 255, 0.5)',
  },
};

const highContrastLightPalette = {
  mode: 'light' as const,
  primary: {
    main: '#0B0E14',
  },
  secondary: {
    main: '#0B0E14',
  },
  background: {
    default: '#ffffff',
    paper: '#ffffff',
  },
  text: {
    primary: '#000000',
    secondary: '#0B0E14',
    disabled: '#4A5568',
  },
  divider: '#000000',
};

/**
 * Paleta para el modo de alto contraste oscuro (High Contrast Dark).
 * Sigue la norma de contraste máximo (Blanco sobre Negro puro) sin semitransparencias.
 */
const highContrastDarkPalette = {
  mode: 'dark' as const,
  primary: {
    main: '#ffffff',
  },
  secondary: {
    main: '#ffffff',
  },
  background: {
    default: '#050505',
    paper: '#050505',
  },
  text: {
    primary: '#ffffff',
    secondary: '#ffffff',
  },
  divider: '#ffffff',
};

/**
 * Defaults de accesibilidad que se aplican a TODOS los temas.
 * Evitan el warning "Blocked aria-hidden on an element because its
 * descendant retained focus" asegurando que Dialog, Modal, Menu y Drawer
 * gestionen correctamente el focus trap y la limpieza de aria-hidden.
 */
const a11yComponentDefaults = {
  MuiDialog: {
    defaultProps: {
      closeAfterTransition: true,
    },
  },
  MuiModal: {
    defaultProps: {
      closeAfterTransition: true,
    },
  },
  MuiMenu: {
    defaultProps: {
      // No mantener el menú en DOM cuando está cerrado: evita que elementos
      // focusables ocultos con aria-hidden retengan el foco.
      keepMounted: false,
    },
  },
  MuiDrawer: {
    defaultProps: {
      // Para drawers temporales, no mantener en DOM cuando están cerrados.
      ModalProps: {
        keepMounted: false,
      },
    },
  },
};

export const getTheme = (themeName: ThemeName, fontSize: FontSize) => {
  const typography = getTypography(fontSize) as Record<string, unknown>;
  let palette;
  let components: Record<string, unknown> = {};

  switch (themeName) {
    case 'light':
      palette = lightPalette;
      break;
    case 'dark':
      palette = darkPalette;
      break;
    case 'highContrastLight':
      palette = highContrastLightPalette;
      components = {
        MuiButton: {
          styleOverrides: {
            root: {
              border: '2px solid #0B0E14',
              fontWeight: 'bold',
            },
          },
        },
        MuiTablePagination: {
          styleOverrides: {
            root: {
              borderTop: 'none',
            },
            selectLabel: ({ theme }: { theme: Theme }) => ({
              fontSize: '0.875rem',
              color: theme.palette.text.secondary,
            }),
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              border: '1px solid #0B0E14',
            },
          },
        },
      };
      typography.allVariants = { fontWeight: 'bold' };
      break;
    case 'highContrastDark':
      palette = highContrastDarkPalette;
      components = {
        MuiButton: {
          styleOverrides: {
            root: {
              border: '2px solid #ffffff',
              fontWeight: 'bold',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              border: '1px solid #ffffff',
            },
          },
        },
      };
      typography.allVariants = { fontWeight: 'bold' };
      break;
    default:
      palette = lightPalette;
  }

  /**
   * Overrides globales para componentes que se aplican a todos los temas.
   */
  const baseComponents = {
    ...a11yComponentDefaults,
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 42,
        },
      },
    },
    MuiTab: {
      defaultProps: {
        iconPosition: 'start' as const,
      },
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          minHeight: 42,
          paddingTop: 8,
          paddingBottom: 8,
          fontWeight: 600,
          textTransform: 'none' as const,
          fontSize: '0.875rem',
          [theme.breakpoints.up('sm')]: {
            minHeight: 42,
          },
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          borderRadius: 8,
          textTransform: 'none' as const,
          fontWeight: 600,
          '&.Mui-disabled': {
            backgroundColor:
              theme.palette.mode === 'light' ? '#f0f0f0' : '#2c2c2c',
            color: theme.palette.mode === 'light' ? '#666666' : '#aaaaaa',
          },
        }),
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
  };

  return createTheme({
    palette,
    typography,
    components: { ...baseComponents, ...components },
  });
};
