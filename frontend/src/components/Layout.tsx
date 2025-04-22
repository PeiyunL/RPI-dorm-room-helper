import React from 'react';
import TopNav from './TopNav';
import SideNav from './SideNav';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <TopNav />
      <Box display="flex">
        <SideNav />
        <Box component="main" sx={{ flex: 1, p: 3, mt: 8 }}> {/* ⬅️ mt: 8 adds space for TopNav */}
          <Outlet />
        </Box>
      </Box>
    </>
  );
}