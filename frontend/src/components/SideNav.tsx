import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HistoryIcon from '@mui/icons-material/History';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import InfoIcon from '@mui/icons-material/Info';
import { Link } from 'react-router';

const drawerWidth = 240;

const links = [
  {label: 'Home page', path: '/homepage', icon: <HomeIcon />},
  {label: 'Map', path: '/map', icon: <MapIcon />},
  {label: 'Favorite', path: '/favorite', icon: <FavoriteIcon />},
  {label: 'Record', path: '/record', icon: <HistoryIcon />},
  {label: 'Setting', path: '/setting', icon: <SettingsApplicationsIcon />},
  {label: 'About us', path: '/about_us', icon: <InfoIcon />}
];

export default function SideNav() {
  return (
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {links.map((text) => (
                <Link to={text.path} key={text.label} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <ListItem key={text.label} disablePadding>
                        <ListItemButton>
                        <ListItemIcon>
                            {text.icon}
                        </ListItemIcon>
                        <ListItemText primary={text.label} />
                        </ListItemButton>
                    </ListItem>
                </Link>

            ))}
          </List>
        </Box>
      </Drawer>
  );
}
