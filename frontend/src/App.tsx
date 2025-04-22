import React, { useEffect, useState } from 'react';
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

const theme = createTheme({
  palette: {
    primary: {
      main: '#c21818',
    },
  },
  components: {
    MuiTypography: {
      defaultProps: {
        color: 'inherit',
      },
    },
  },
});

const ProtectedRoute = () => {
  return pb.authStore.isValid ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize auth state
    setIsAuthenticated(pb.authStore.isValid);
    setIsLoading(false);

    // Listen to auth changes
    const removeListener = pb.authStore.onChange(() => {
      setIsAuthenticated(pb.authStore.isValid);
    });

    return () => removeListener();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper loading component
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

          {/* Root path redirect */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/homepage" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;