import TopNav from './TopNav';
import SideNav from './SideNav';
import { Box } from '@mui/material';
import MainContent from './MainContent';

function Layout() {
  return (
    <>
        <TopNav />
        <Box display="flex">
            <SideNav />
            <MainContent />
        </Box>
    </>
  );
}

export default Layout;
