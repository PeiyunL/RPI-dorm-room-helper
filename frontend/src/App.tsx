//import './App.css'
import Layout from './components/Layout'
import { CssBaseline } from '@mui/material';
import { Routes, Route } from 'react-router';
import Login from './components/Login';
import HomePage from './modules/HomePage/HomePage';
import Map from './modules/Map/Map';
import Favorite from './modules/Favorite/Favorite';
import Record from './modules/Record/Record';
import Setting from './modules/Setting/Setting';
import AboutUs from './modules/AboutUs/AboutUs';
import { createTheme, ThemeProvider } from '@mui/material';

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


function App() {

  return (
    <>
    <ThemeProvider theme={theme}>
      <CssBaseline />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/homepage" index element={<HomePage />} />
            <Route path="/map" index element={<Map />} />
            <Route path="/favorite" index element={<Favorite />} />
            <Route path="/record" index element={<Record />} />
            <Route path="/setting" index element={<Setting />} />
            <Route path="/about_us" index element={<AboutUs />} />
          </Route>
          <Route path="/login" element={<Login />} />
        </Routes>
    </ThemeProvider>

    </>
  )
}

export default App
