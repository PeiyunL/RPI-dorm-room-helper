import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CssBaseline, createTheme, ThemeProvider } from '@mui/material';
import pb from './lib/pocketbase';

import Layout from './components/Layout';
import Login from './components/Login';
import HomePage from './modules/HomePage/HomePage';
import Map from './modules/Map/Map';
import Favorite from './modules/Favorite/Favorite';
import Record from './modules/Record/Record';
import Setting from './modules/Setting/Setting';
import AboutUs from './modules/AboutUs/AboutUs';
import Register from './components/Register';
import VerifyEmail from "./components/VerifyEmail"; // adjust path as needed

const USERS_COLLECTION = 'users';

/**
 * Optional: if you later want instant refresh after saving settings,
 * dispatch this event from Setting.tsx after updateUser(...) succeeds:
 *
 * window.dispatchEvent(new Event('user-settings-updated'));
 */
const USER_SETTINGS_UPDATED_EVENT = 'user-settings-updated';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);

  // Global preferences
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<string>('en');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#c21818' },
        },
        components: {
          MuiTypography: {
            defaultProps: {
              color: 'inherit',
            },
          },
        },
      }),
    [mode]
  );

  const applyDomPrefs = useCallback((nextMode: 'light' | 'dark', nextLang: string) => {
    // Helps any CSS you might have that reads this attribute
    document.documentElement.setAttribute('data-color-scheme', nextMode);
    // Standard HTML language
    document.documentElement.lang = nextLang || 'en';
  }, []);

  const loadUserPrefs = useCallback(async () => {
    const userId = pb.authStore.model?.id;
    if (!userId) return;

    try {
      const user = await pb.collection(USERS_COLLECTION).getOne(userId);
      const u: any = user;

      const darkMode = Boolean(u.darkMode);
      const nextMode: 'light' | 'dark' = darkMode ? 'dark' : 'light';
      const nextLang: string = u.language || 'en';

      setMode(nextMode);
      setLanguage(nextLang);
      applyDomPrefs(nextMode, nextLang);
    } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("autocancelled")) {
      // ignore - common in React StrictMode / route changes
      return;
    }
    console.warn("Failed to load user prefs:", e);
  }
  }, [applyDomPrefs, mode, language]);

  useEffect(() => {
    // Initial auth state
    setIsAuthenticated(pb.authStore.isValid);

    // Apply defaults immediately (prevents flash)
    applyDomPrefs(mode, language);

    // If already logged in, load preferences
    const init = async () => {
      if (pb.authStore.isValid) {
        await loadUserPrefs();
      }
      setIsLoading(false);
    };

    void init();

    // Listen to auth changes
    const removeListener = pb.authStore.onChange(async () => {
      const valid = pb.authStore.isValid;
      setIsAuthenticated(valid);

      if (valid) {
        await loadUserPrefs();
      } else {
        // Logged out: reset to defaults
        setMode('light');
        setLanguage('en');
        applyDomPrefs('light', 'en');
      }
    });

    // Optional: allow Settings page to tell App to refresh prefs after saving
    const onSettingsUpdated = async () => {
      if (pb.authStore.isValid) {
        await loadUserPrefs();
      }
    };
    window.addEventListener(USER_SETTINGS_UPDATED_EVENT, onSettingsUpdated);

    return () => {
      removeListener();
      window.removeEventListener(USER_SETTINGS_UPDATED_EVENT, onSettingsUpdated);
    };
  }, [applyDomPrefs, loadUserPrefs, mode, language]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const ProtectedRoute = () => {
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
  };

  const PublicRoute = () => {
    return !isAuthenticated ? <Outlet /> : <Navigate to="/homepage" replace />;
  };

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          {/* Public routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/homepage" element={<HomePage />} />
              <Route path="/map" element={<Map />} />
              <Route path="/favorite" element={<Favorite />} />
              <Route path="/record" element={<Record />} />
              <Route path="/setting" element={<Setting />} />
              <Route path="/about_us" element={<AboutUs />} />
            </Route>
          </Route>

          {/* Standalone public routes */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Root path redirect */}
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/homepage" replace /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
