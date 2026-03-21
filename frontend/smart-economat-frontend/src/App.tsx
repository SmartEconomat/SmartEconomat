import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeContextProvider } from './store/ThemeContext';
import { useThemeContext } from './store/theme.hooks';
import AppRouter from './routes/AppRouter';
import { AuthProvider } from './store/AuthContext';
import { ToastProvider } from './store/ToastContext';
import ToastContainer from './components/common/Notification/ToastContainer';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/es';

import { Provider } from 'react-redux';
import { store } from './store';

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
