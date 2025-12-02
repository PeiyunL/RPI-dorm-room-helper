import {
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Stack,
  Box,
  Divider,
  Chip,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Link,
} from '@mui/material';

import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';

import InfoIcon from '@mui/icons-material/Info';
import SchoolIcon from '@mui/icons-material/School';
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import FilterListIcon from '@mui/icons-material/FilterList';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import CodeIcon from '@mui/icons-material/Code';
import EmailIcon from '@mui/icons-material/Email';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import SecurityIcon from '@mui/icons-material/Security';
import UpdateIcon from '@mui/icons-material/Update';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import DevicesIcon from '@mui/icons-material/Devices';
import SpeedIcon from '@mui/icons-material/Speed';
import GitHubIcon from '@mui/icons-material/GitHub';
import BugReportIcon from '@mui/icons-material/BugReport';

export default function AboutUs() {
  const features = [
    {
      icon: <SearchIcon />,
      title: 'Smart Search',
      description: 'Quickly search and browse detailed information for all RPI residence halls'
    },
    {
      icon: <FilterListIcon />,
      title: 'Advanced Filters',
      description: 'Filter by room type, price range, amenities, and more to find your ideal room'
    },
    {
      icon: <MapIcon />,
      title: 'Interactive Maps',
      description: 'Visualize dorm locations and nearby campus facilities with our interactive map'
    },
    {
      icon: <CompareArrowsIcon />,
      title: 'Room Comparison',
      description: 'Compare multiple rooms side-by-side to make the best housing decision'
    },
    {
      icon: <VisibilityIcon />,
      title: '360° Views',
      description: 'Virtual tours and panoramic views of rooms and common areas'
    },
    {
      icon: <StarIcon />,
      title: 'Save Favorites',
      description: 'Bookmark your favorite rooms for easy access during selection period'
    }
  ];

  const techStack = [
    'React 18',
    'TypeScript',
    'Material-UI',
    'GeoJSON',
    'Leaflet Maps',
    'Vite',
    'Node.js',
    'PostgreSQL'
  ];

  const projectValues = [
    {
      icon: <DevicesIcon />,
      title: 'Accessibility',
      description: 'Fully responsive design that works on all devices'
    },
    {
      icon: <SpeedIcon />,
      title: 'Performance',
      description: 'Lightning-fast load times and smooth interactions'
    },
    {
      icon: <SecurityIcon />,
      title: 'Privacy',
      description: 'Your data is secure and never shared with third parties'
    },
    {
      icon: <UpdateIcon />,
      title: 'Up-to-date',
      description: 'Regularly updated with the latest housing information'
    }
  ];

  const faqs = [
    {
      question: 'Which residence halls are included in this platform?',
      answer: 'Our platform covers all undergraduate residence halls at RPI, including Freshman Hill (Barton, Bray, Cary, Crockett, Hall, Nason), the Quadrangle dorms, BARH (Berkshire, Rensselaer, Tibbits, Davison, Nugent, Sharp, Warren), Blitman Commons, and more.'
    },
    {
      question: 'How accurate is the room information?',
      answer: 'We source our data directly from RPI\'s Residential Life office and update it regularly. We also incorporate student feedback to ensure accuracy. However, always verify critical information with ResLife before making final decisions.'
    },
    {
      question: 'Can I see actual photos of the rooms?',
      answer: 'Yes! We provide both official photos and 360° virtual tours where available. We\'re continuously adding more visual content based on student contributions and official updates.'
    },
    {
      question: 'How does the comparison feature work?',
      answer: 'Simply click the "Add to Compare" button on any room listing. You can compare up to 4 rooms simultaneously across various criteria including size, amenities, location, and price.'
    },
    {
      question: 'Is this platform officially affiliated with RPI?',
      answer: 'This is a student-created project designed to help the RPI community. While we use official data sources, always confirm important housing decisions with the Office of Residential Life.'
    },
    {
      question: 'How can I report incorrect information?',
      answer: 'Use the feedback button on any room page to report inaccuracies, or contact us directly via email. We review all reports and update information promptly.'
    }
  ];

  const timeline = [
    {
      title: 'Project Inception',
      description: 'Identified the need for a better dorm selection tool'
    },
    {
      title: 'Research & Planning',
      description: 'Surveyed students and gathered requirements'
    },
    {
      title: 'Development',
      description: 'Built the platform using modern web technologies'
    },
    {
      title: 'Beta Testing',
      description: 'Tested with RPI students and incorporated feedback'
    },
    {
      title: 'Launch',
      description: 'Official release to the RPI community'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Hero Section */}
      <Card elevation={3} sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ py: 5 }}>
          <Stack direction="row" spacing={3} alignItems="center" mb={3}>
            <Avatar sx={{ bgcolor: 'white', width: 64, height: 64 }}>
              <HomeIcon fontSize="large" sx={{ color: '#667eea' }} />
            </Avatar>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'white' }}>
                RPI Dorm Room Helper
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Making dorm selection simple, smart, and stress-free
              </Typography>
            </Box>
          </Stack>
          
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.95)', mb: 3 }} paragraph>
            Welcome to the RPI Dorm Room Helper! Our mission is to provide Rensselaer Polytechnic Institute students 
            with a comprehensive platform to explore, compare, and select the perfect dormitory room. 
            Whether you're an incoming freshman or a returning student looking to change rooms, 
            we're here to help you make an informed decision.
          </Typography>
          
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Chip icon={<SchoolIcon />} label="RPI Community Project" sx={{ bgcolor: 'white' }} />
            <Chip icon={<UpdateIcon />} label="Updated for 2024-2025" sx={{ bgcolor: 'white' }} />
            <Chip icon={<GroupIcon />} label="Student-Built" sx={{ bgcolor: 'white' }} />
          </Stack>
        </CardContent>
      </Card>

      {/* Key Features */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={4}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <StarIcon />
          </Avatar>
          <Typography variant="h4" component="h2">
            Key Features
          </Typography>
        </Stack>
        
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '100%', 
                  transition: 'all 0.3s', 
                  '&:hover': { 
                    boxShadow: 4,
                    transform: 'translateY(-4px)'
                  } 
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                      {feature.icon}
                    </Avatar>
                    <Typography variant="h6" component="h3">
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* How It Works */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TipsAndUpdatesIcon />
                </Avatar>
                <Typography variant="h5" component="h2">
                  How It Works
                </Typography>
              </Stack>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="1. Browse Residence Halls"
                    secondary="Start by exploring all available residence halls on campus"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="2. Apply Filters"
                    secondary="Narrow down options based on your preferences and needs"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="3. View Details"
                    secondary="Check room layouts, amenities, and virtual tours"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="4. Compare Options"
                    secondary="Use our comparison tool to evaluate multiple rooms"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="5. Save Favorites"
                    secondary="Bookmark your top choices for the selection period"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TouchAppIcon />
                </Avatar>
                <Typography variant="h5" component="h2">
                  Project Journey
                </Typography>
              </Stack>
              
              <Timeline position="alternate">
                {timeline.map((item, index) => (
                  <TimelineItem key={index}>
                    <TimelineSeparator>
                      <TimelineDot color={index === timeline.length - 1 ? "success" : "primary"} />
                      {index < timeline.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle2" component="h3">
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Our Values */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={3}>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            <StarIcon />
          </Avatar>
          <Typography variant="h5" component="h2">
            Our Values
          </Typography>
        </Stack>
        
        <Grid container spacing={3}>
          {projectValues.map((value, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
                  {value.icon}
                </Avatar>
                <Typography variant="h6" component="h3">
                  {value.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {value.description}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* FAQs */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={3}>
          <Avatar sx={{ bgcolor: 'warning.main' }}>
            <InfoIcon />
          </Avatar>
          <Typography variant="h5" component="h2">
            Frequently Asked Questions
          </Typography>
        </Stack>
        
        {faqs.map((faq, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="medium">
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* Tech Stack & Contact */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <CodeIcon />
                </Avatar>
                <Typography variant="h5" component="h2">
                  Built With Modern Tech
                </Typography>
              </Stack>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                We leverage cutting-edge web technologies to ensure the best performance, 
                user experience, and reliability:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {techStack.map((tech, index) => (
                  <Chip 
                    key={index} 
                    label={tech} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                Open source and community-driven. We welcome contributions!
              </Typography>

              <Button 
                variant="outlined" 
                startIcon={<GitHubIcon />}
                href="https://github.com/[username]/[repository]"
                target="_blank"
                fullWidth
              >
                View on GitHub
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <GroupIcon />
                </Avatar>
                <Typography variant="h5" component="h2">
                  Get In Touch
                </Typography>
              </Stack>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Have questions, suggestions, or found a bug? We'd love to hear from you! 
                Your feedback helps us improve the platform for everyone.
              </Typography>
              
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon color="action" fontSize="small" />
                  <Typography variant="body2">
                    General Inquiries: [contact-email@rpi.edu]
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <BugReportIcon color="action" fontSize="small" />
                  <Typography variant="body2">
                    Bug Reports: [bugs-email@rpi.edu]
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <SchoolIcon color="action" fontSize="small" />
                  <Typography variant="body2">
                    Office: [Building Name, Room Number]
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                  <Button 
                    variant="contained" 
                    startIcon={<EmailIcon />}
                    href="mailto:[contact-email@rpi.edu]"
                    fullWidth
                  >
                    Send Feedback
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error"
                    startIcon={<BugReportIcon />}
                    href="mailto:[bugs-email@rpi.edu]"
                    fullWidth
                  >
                    Report a Bug
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 6, pt: 4, borderTop: 2, borderColor: 'divider' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              About This Project
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              RPI Dorm Room Helper is a student-led initiative to improve the housing 
              selection process at Rensselaer Polytechnic Institute. We believe that 
              choosing where you live should be an informed, stress-free decision.
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Stack spacing={1}>
              <Link href="#" color="inherit" underline="hover">Privacy Policy</Link>
              <Link href="#" color="inherit" underline="hover">Terms of Service</Link>
              <Link href="#" color="inherit" underline="hover">Data Sources</Link>
              <Link href="#" color="inherit" underline="hover">Accessibility</Link>
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom>
              Resources
            </Typography>
            <Stack spacing={1}>
              <Link href="https://reslife.rpi.edu" target="_blank" color="inherit" underline="hover">
                RPI ResLife
              </Link>
              <Link href="#" color="inherit" underline="hover">Housing Calendar</Link>
              <Link href="#" color="inherit" underline="hover">Selection Guide</Link>
              <Link href="#" color="inherit" underline="hover">FAQ</Link>
            </Stack>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            © 2024 RPI Dorm Room Helper. All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Made with ❤️ by RPI Students, for RPI Students
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}