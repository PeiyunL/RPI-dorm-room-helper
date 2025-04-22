import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  PersonOutline as ProfileIcon,
  VpnKey as PasswordIcon,
  DeleteOutline as DeleteIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Language as LanguageIcon,
  Help as HelpIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

// Interface for user profile
interface UserProfile {
  name: string;
  email: string;
  phone: string;
  major: string;
  year: string;
  bio: string;
  avatarUrl?: string;
}

export default function Setting() {
  // Initial profile data
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Alex Johnson',
    email: 'ajohnson@rpi.edu',
    phone: '(555) 123-4567',
    major: 'Computer Science',
    year: 'Junior',
    bio: 'Computer Science student at RPI interested in software development and AI.'
  });

  // Settings states
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [appNotifications, setAppNotifications] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>('en');
  
  // For editing profile
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  
  // For password change
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // For account deletion
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>('');
  
  // For notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Handle language change
  const handleLanguageChange = (event: SelectChangeEvent) => {
    setLanguage(event.target.value as string);
    showSnackbar('Language preference updated', 'success');
  };

  // Toggle dark mode
  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    showSnackbar(`Dark mode ${!darkMode ? 'enabled' : 'disabled'}`, 'success');
  };

  // Toggle email notifications
  const handleEmailNotificationsToggle = () => {
    setEmailNotifications(!emailNotifications);
    showSnackbar(`Email notifications ${!emailNotifications ? 'enabled' : 'disabled'}`, 'success');
  };

  // Toggle app notifications
  const handleAppNotificationsToggle = () => {
    setAppNotifications(!appNotifications);
    showSnackbar(`App notifications ${!appNotifications ? 'enabled' : 'disabled'}`, 'success');
  };

  // Handle profile edit mode
  const handleEditProfile = () => {
    setEditMode(true);
    setEditedProfile({...profile});
  };

  // Handle profile changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile({
      ...editedProfile,
      [name]: value
    });
  };

  // Save profile changes
  const handleSaveProfile = () => {
    setProfile(editedProfile);
    setEditMode(false);
    showSnackbar('Profile updated successfully', 'success');
  };

  // Cancel profile edit
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedProfile(profile);
  };

  // Open password change dialog
  const handleOpenPasswordDialog = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordDialogOpen(true);
  };

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  // Save password changes
  const handleSavePassword = () => {
    // Validate password
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar('New passwords do not match', 'error');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      showSnackbar('Password must be at least 8 characters', 'error');
      return;
    }
    
    // Here you would call an API to update the password
    setPasswordDialogOpen(false);
    showSnackbar('Password updated successfully', 'success');
  };

  // Open delete account dialog
  const handleOpenDeleteDialog = () => {
    setDeleteConfirmation('');
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation input
  const handleDeleteConfirmationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeleteConfirmation(e.target.value);
  };

  // Delete account
  const handleDeleteAccount = () => {
    // Here you would call an API to delete the account
    setDeleteDialogOpen(false);
    showSnackbar('Account deleted', 'info');
    // In a real app, you would log the user out and redirect to a landing page
  };

  // Show snackbar notification
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Logout function
  const handleLogout = () => {
    // Here you would handle logout logic
    showSnackbar('You have been logged out', 'info');
    // In a real app, you would clear auth tokens and redirect to login
  };

  return (
    <div>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            Settings
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
            Manage your account preferences and profile
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Profile Section */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ProfileIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Profile Information</Typography>
                </Box>
                {!editMode ? (
                  <Button 
                    startIcon={<EditIcon />} 
                    onClick={handleEditProfile}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box>
                    <Button 
                      color="primary" 
                      startIcon={<SaveIcon />} 
                      onClick={handleSaveProfile}
                      sx={{ mr: 1 }}
                    >
                      Save
                    </Button>
                    <Button 
                      color="inherit" 
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ width: 100, height: 100, mb: 2 }}
                    src={profile.avatarUrl}
                  >
                    {profile.name.charAt(0)}
                  </Avatar>
                  {editMode && (
                    <Button size="small" variant="outlined">
                      Change Photo
                    </Button>
                  )}
                </Grid>
                
                <Grid item xs={12} md={9}>
                  {editMode ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          name="name"
                          value={editedProfile.name}
                          onChange={handleProfileChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          value={editedProfile.email}
                          onChange={handleProfileChange}
                          InputProps={{
                            startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          name="phone"
                          value={editedProfile.phone}
                          onChange={handleProfileChange}
                          InputProps={{
                            startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Major"
                          name="major"
                          value={editedProfile.major}
                          onChange={handleProfileChange}
                          InputProps={{
                            startAdornment: <SchoolIcon color="action" sx={{ mr: 1 }} />,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel id="year-label">Year</InputLabel>
                          <Select
                            labelId="year-label"
                            id="year"
                            name="year"
                            value={editedProfile.year}
                            label="Year"
                            onChange={(e) => setEditedProfile({...editedProfile, year: e.target.value})}
                          >
                            <MenuItem value="Freshman">Freshman</MenuItem>
                            <MenuItem value="Sophomore">Sophomore</MenuItem>
                            <MenuItem value="Junior">Junior</MenuItem>
                            <MenuItem value="Senior">Senior</MenuItem>
                            <MenuItem value="Graduate">Graduate</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Bio"
                          name="bio"
                          multiline
                          rows={4}
                          value={editedProfile.bio}
                          onChange={handleProfileChange}
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="h6">{profile.name}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EmailIcon color="action" sx={{ mr: 1 }} />
                          <Typography variant="body1">{profile.email}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PhoneIcon color="action" sx={{ mr: 1 }} />
                          <Typography variant="body1">{profile.phone}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <SchoolIcon color="action" sx={{ mr: 1 }} />
                          <Typography variant="body1">{profile.major}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <strong>Year:</strong> {profile.year}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          <strong>Bio:</strong>
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {profile.bio}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Notification Settings Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Notification Settings</Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <List disablePadding>
                <ListItem>
                  <ListItemText
                    primary="Email Notifications"
                    secondary="Receive email updates about your posts and comments"
                  />
                  <Switch
                    edge="end"
                    checked={emailNotifications}
                    onChange={handleEmailNotificationsToggle}
                  />
                </ListItem>
                <Divider component="li" />
                
                <ListItem>
                  <ListItemText
                    primary="App Notifications"
                    secondary="Receive in-app notifications about activity"
                  />
                  <Switch
                    edge="end"
                    checked={appNotifications}
                    onChange={handleAppNotificationsToggle}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Appearance & Language Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DarkModeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Appearance & Language</Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <List disablePadding>
                <ListItem>
                  <ListItemText
                    primary="Dark Mode"
                    secondary="Toggle dark theme for the application"
                  />
                  <Switch
                    edge="end"
                    checked={darkMode}
                    onChange={handleDarkModeToggle}
                  />
                </ListItem>
                <Divider component="li" />
                
                <ListItem>
                  <ListItemText
                    primary="Language"
                    secondary="Select your preferred language"
                  />
                  <FormControl sx={{ minWidth: 120 }} size="small">
                    <Select
                      value={language}
                      onChange={handleLanguageChange}
                      displayEmpty
                      inputProps={{ 'aria-label': 'Language' }}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Español</MenuItem>
                      <MenuItem value="fr">Français</MenuItem>
                      <MenuItem value="zh">中文</MenuItem>
                    </Select>
                  </FormControl>
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Security Section */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PasswordIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Security</Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PasswordIcon />}
                    onClick={handleOpenPasswordDialog}
                  >
                    Change Password
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<DeleteIcon />}
                    onClick={handleOpenDeleteDialog}
                  >
                    Delete Account
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Help & Logout Section */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <List disablePadding>
                <ListItem component="a" href="#/help" sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <HelpIcon />
                  </ListItemIcon>
                  <ListItemText primary="Help & Support" />
                </ListItem>
                <Divider component="li" />
                <ListItem onClick={handleLogout} sx={{ cursor: 'pointer' }}>
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>

        {/* Password Change Dialog */}
        <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Please enter your current password and a new password.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              name="currentPassword"
              label="Current Password"
              type="password"
              fullWidth
              variant="outlined"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="newPassword"
              label="New Password"
              type="password"
              fullWidth
              variant="outlined"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              fullWidth
              variant="outlined"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePassword} variant="contained">Update Password</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              This action cannot be undone. All your data, including posts and comments, will be permanently deleted.
            </DialogContentText>
            <DialogContentText sx={{ mb: 2 }}>
              To confirm, please type "delete my account" below:
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              fullWidth
              variant="outlined"
              value={deleteConfirmation}
              onChange={handleDeleteConfirmationChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleDeleteAccount} 
              color="error" 
              variant="contained"
              disabled={deleteConfirmation !== "delete my account"}
            >
              Delete Account
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
}