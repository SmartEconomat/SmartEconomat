import React from 'react';
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
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';

import { Provider } from 'react-redux';
import { store } from './store';
import { SidebarProvider } from './store/SidebarContext';
import { TutorialProvider } from './store/TutorialContext';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18nInstance from './i18n';

function App() {
  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18nInstance}>
        <ThemeContextProvider>
          <SidebarProvider>
            <Main />
          </SidebarProvider>
        </ThemeContextProvider>
      </I18nextProvider>
    </Provider>
  );
}

function Main() {
  const { siteTheme } = useThemeContext();
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.slice(0, 2) || 'es';

  // Sincronizar dayjs
  React.useEffect(() => {
    dayjs.locale(currentLang);
  }, [currentLang]);

  return (
    <ThemeProvider theme={siteTheme}>
      <CssBaseline />
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale={currentLang}
      >
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
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
