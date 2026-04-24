import './i18n';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeContextProvider } from './store/ThemeContext';
import { useThemeContext } from './store/theme.hooks';
import AppRouter from './routes/AppRouter';
import { AuthProvider } from './sherlock-auth/provider';
import { ToastProvider } from './store/ToastContext';
import ToastContainer from './components/common/Notification/ToastContainer';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/es';
import { Provider } from 'react-redux';
import { store } from './store';

/**
 * Componente principal de la aplicación.
 *
 * Configura los providers globales: Redux store, localización de fechas,
 * tema visual, notificaciones y autenticación.
 *
 * @returns Árbol completo de providers con el router.
 * @example
 * ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
 */
function App() {
  return (
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <ThemeContextProvider>
          <Main />
        </ThemeContextProvider>
      </LocalizationProvider>
    </Provider>
  );
}

/**
 * Nodo interno que consume el contexto de tema y renderiza la UI.
 *
 * Separado de `App` para poder llamar al hook `useThemeContext` dentro
 * de su propio provider (`ThemeContextProvider`).
 *
 * @returns Shell de la aplicación con tema, toasts y rutas.
 */
function Main() {
  const { siteTheme } = useThemeContext();

  return (
    <ThemeProvider theme={siteTheme}>
      <CssBaseline />
      <ToastProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
