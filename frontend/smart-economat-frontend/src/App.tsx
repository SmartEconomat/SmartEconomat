import { BrowserRouter } from 'react-router-dom';
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
import { SidebarProvider } from './store/SidebarContext';
import { TutorialProvider } from './store/TutorialContext';

function App() {
  return (
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <ThemeContextProvider>
          <SidebarProvider>
            <Main />
          </SidebarProvider>
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
        <BrowserRouter>
          <AuthProvider>
            <TutorialProvider>
              <AppRouter />
            </TutorialProvider>
          </AuthProvider>
        </BrowserRouter>
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
