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
    default: '#121212',
    paper: '#1e1e1e',
  },
};

const highContrastLightPalette = {
  mode: 'light' as const,
  primary: {
    main: '#000000',
  },
  secondary: {
    main: '#000000',
  },
  background: {
    default: '#ffffff',
    paper: '#ffffff',
  },
  text: {
    primary: '#000000',
    secondary: '#000000',
  },
  divider: '#000000',
};

const highContrastDarkPalette = {
  mode: 'dark' as const,
  primary: {
    main: '#ffffff',
  },
  secondary: {
    main: '#ffffff',
  },
  background: {
    default: '#000000',
    paper: '#000000',
  },
  text: {
    primary: '#ffffff',
    secondary: '#ffffff',
  },
  divider: '#ffffff',
};

export const getTheme = (themeName: ThemeName, fontSize: FontSize) => {
  const typography = getTypography(fontSize) as Record<string, unknown>;
  let palette;
  let components = {};

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
              border: '2px solid #000000',
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
              border: '1px solid #000000',
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

  return createTheme({
    palette,
    typography,
    components,
  });
};
