import { Container, Typography, Card, CardContent, Avatar, Stack } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

export default function AboutUs() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <InfoIcon />
            </Avatar>
            <Typography variant="h4" component="h1">
              About Us
            </Typography>
          </Stack>
          <Typography variant="body1" color="text.secondary" paragraph>
            Welcome to the RPI Dorm Room Helper! Our mission is to help RPI students explore and compare dormitories easily.
            We provide filters, dorm maps, and visual aids to help you choose the best room for your needs.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This project is built using modern web technologies including React, MUI, and GeoJSON. Our goal is to make the room selection process simpler, smarter, and more user-friendly.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
