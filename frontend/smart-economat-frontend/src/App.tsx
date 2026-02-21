import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeContextProvider, useThemeContext } from './store/ThemeContext';
import AppRouter from './routes/AppRouter';
import { AuthProvider } from './store/AuthContext';
import { ToastProvider } from './store/ToastContext';
import ToastContainer from './components/common/Notification/ToastContainer';

function App() {
  return (
    <ThemeContextProvider>
      <Main />
    </ThemeContextProvider>
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
