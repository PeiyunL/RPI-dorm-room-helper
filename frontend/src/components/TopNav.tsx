import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router';
// import { useAppSelector } from '../hooks/useAppSelector';
// import useUsers from '../hooks/useUsers';


export default function TopNav() {
  const navigate = useNavigate();
  // const user = useAppSelector(state => state.user.user);
  // const { logout } = useUsers();
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            RPI Dorm Room Helper
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Login</Button>          
          {/* {user ? (
            <Box display="flex" alignItems="center" gap={2}>
              <Typography sx={{ mr: 2 }}>{user.name}</Typography>
              <Button color="inherit" onClick={() => logout()}>Logout</Button>
            </Box>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
          )} */}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
