import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '../../lib/pocketbase';

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
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Grid,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  InputAdornment
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
  Help as HelpIcon,
  Logout as LogoutIcon,
  Language as LanguageIcon,
  Upload as UploadIcon
} from '@mui/icons-material';

const USERS_COLLECTION = 'users';
const MIN_PASSWORD_LENGTH = 8;
const DELETE_CONFIRMATION_TEXT = 'delete my account';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  major: string;
  year: string;
  bio: string;
  avatarUrl?: string;
}

type PersistedSettings = {
  darkMode: boolean;
  emailNotifications: boolean;
  appNotifications: boolean;
  language: string;
  phone: string;
  major: string;
  year: string;
  bio: string;
  name: string;
  email: string;
};

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
};

// Utility functions
const getAvatarUrl = (user: any): string => {
  if (!user?.avatar) return '';
  try {
    return pb.files.getUrl(user, user.avatar, { thumb: '100x100' });
  } catch {
    return '';
  }
};

const getSavedTheme = (): boolean => {
  const saved = localStorage.getItem('theme');
  return saved === 'dark';
};

const getSavedLanguage = (): string => {
  return localStorage.getItem('i18n_lang') || 'en';
};

export default function Setting() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    major: '',
    year: '',
    bio: '',
    avatarUrl: '',
  });
  const [loading, setLoading] = useState(true);

  // Settings states
  const [darkMode, setDarkMode] = useState<boolean>(getSavedTheme);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [appNotifications, setAppNotifications] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>(getSavedLanguage);

  // Edit mode states
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Password change states
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState<boolean>(false);

  // Account deletion states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>('');
  const [deleting, setDeleting] = useState<boolean>(false);

  // Notification state
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Loading states
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);

  // Apply dark mode theme
  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Snackbar helper
  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Update user helper
  const updateUser = useCallback(
    async (fields: Partial<PersistedSettings & { avatar?: File } & any>) => {
      const userId = pb.authStore.model?.id;
      if (!userId) throw new Error('Not authenticated');

      if (fields.avatar) {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => {
          if (k === 'avatar' && v instanceof File) {
            fd.append('avatar', v);
          } else if (v !== undefined) {
            fd.append(k, String(v));
          }
        });
        return await pb.collection(USERS_COLLECTION).update(userId, fd);
      }

      return await pb.collection(USERS_COLLECTION).update(userId, fields);
    },
    []
  );

  // Load user data
  useEffect(() => {
    const user = pb.authStore.model;
    if (!user) {
      navigate('/login');
      return;
    }

    const userAny = user as any;
    setProfile({
      name: userAny.name || '',
      email: userAny.email || '',
      phone: userAny.phone || '',
      major: userAny.major || '',
      year: userAny.year || '',
      bio: userAny.bio || '',
      avatarUrl: getAvatarUrl(user),
    });

    setEmailNotifications(userAny.emailNotifications ?? true);
    setAppNotifications(userAny.appNotifications ?? true);
    setLanguage(userAny.language || getSavedLanguage());
    setDarkMode(userAny.darkMode ?? getSavedTheme());

    setLoading(false);
  }, [navigate]);

  // Sync edited profile when profile updates
  useEffect(() => {
    if (editMode) {
      setEditedProfile(profile);
    }
  }, [profile, editMode]);

  // Toggle handler factory
  const createToggleHandler = useCallback(
    (
      field: 'darkMode' | 'emailNotifications' | 'appNotifications',
      currentValue: boolean,
      setter: React.Dispatch<React.SetStateAction<boolean>>,
      label: string
    ) => async () => {
      const nextValue = !currentValue;
      setter(nextValue);
      try {
        await updateUser({ [field]: nextValue });
        showSnackbar(`${label} ${nextValue ? 'enabled' : 'disabled'}`, 'success');
      } catch (e: any) {
        setter(currentValue);
        showSnackbar(`Failed to save ${label}: ${e?.message || e}`, 'error');
      }
    },
    [updateUser, showSnackbar]
  );

  // Language change handler
  const handleLanguageChange = useCallback(async (event: SelectChangeEvent) => {
    const value = event.target.value;
    const prev = language;
    setLanguage(value);
    localStorage.setItem('i18n_lang', value);
    try {
      await updateUser({ language: value });
      showSnackbar('Language preference updated', 'success');
    } catch (e: any) {
      setLanguage(prev);
      localStorage.setItem('i18n_lang', prev);
      showSnackbar(`Failed to update language: ${e?.message || e}`, 'error');
    }
  }, [language, updateUser, showSnackbar]);

  // Memoized toggle handlers
  const handleDarkModeToggle = useMemo(
    () => createToggleHandler('darkMode', darkMode, setDarkMode, 'Dark mode'),
    [createToggleHandler, darkMode]
  );

  const handleEmailNotificationsToggle = useMemo(
    () => createToggleHandler('emailNotifications', emailNotifications, setEmailNotifications, 'Email notifications'),
    [createToggleHandler, emailNotifications]
  );

  const handleAppNotificationsToggle = useMemo(
    () => createToggleHandler('appNotifications', appNotifications, setAppNotifications, 'App notifications'),
    [createToggleHandler, appNotifications]
  );

  // Profile edit handlers
  const handleEditProfile = useCallback(() => {
    setEditMode(true);
    setEditedProfile({ ...profile });
  }, [profile]);

  const handleProfileChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleYearChange = useCallback((e: SelectChangeEvent) => {
    setEditedProfile(prev => ({ ...prev, year: e.target.value }));
  }, []);

  const handleSaveProfile = useCallback(async () => {
    setSavingProfile(true);
    try {
      const payload: Partial<PersistedSettings> = {
        name: editedProfile.name,
        email: editedProfile.email,
        phone: editedProfile.phone,
        major: editedProfile.major,
        year: editedProfile.year,
        bio: editedProfile.bio,
      };
      const rec = await updateUser(payload);

      setProfile({
        ...editedProfile,
        avatarUrl: getAvatarUrl(rec),
      });
      setEditMode(false);
      showSnackbar('Profile updated successfully', 'success');
    } catch (e: any) {
      showSnackbar(`Failed to update profile: ${e?.message || e}`, 'error');
    } finally {
      setSavingProfile(false);
    }
  }, [editedProfile, updateUser, showSnackbar]);

  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
    setEditedProfile(profile);
  }, [profile]);

  // Avatar upload handlers
  const onClickChangePhoto = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onAvatarFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const rec = await updateUser({ avatar: file });
      const url = getAvatarUrl(rec);
      setProfile(p => ({ ...p, avatarUrl: url }));
      if (editMode) {
        setEditedProfile(p => ({ ...p, avatarUrl: url }));
      }
      showSnackbar('Avatar updated', 'success');
    } catch (err: any) {
      showSnackbar(`Failed to upload avatar: ${err?.message || err}`, 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [updateUser, showSnackbar, editMode]);

  // Password dialog handlers
  const handleOpenPasswordDialog = useCallback(() => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordDialogOpen(true);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSavePassword = useCallback(async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar('New passwords do not match', 'error');
      return;
    }
    if (passwordData.newPassword.length < MIN_PASSWORD_LENGTH) {
      showSnackbar(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await updateUser({
        oldPassword: passwordData.currentPassword,
        password: passwordData.newPassword,
        passwordConfirm: passwordData.confirmPassword,
      } as any);

      setPasswordDialogOpen(false);
      showSnackbar('Password updated successfully', 'success');
    } catch (e: any) {
      showSnackbar(`Failed to update password: ${e?.message || e}`, 'error');
    } finally {
      setSavingPassword(false);
    }
  }, [passwordData, updateUser, showSnackbar]);

  // Delete account handlers
  const handleOpenDeleteDialog = useCallback(() => {
    setDeleteConfirmation('');
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmation !== DELETE_CONFIRMATION_TEXT) return;
    const userId = pb.authStore.model?.id;
    if (!userId) return;

    setDeleting(true);
    try {
      await pb.collection(USERS_COLLECTION).delete(userId);
      pb.authStore.clear();
      showSnackbar('Account deleted', 'info');
      navigate('/login');
    } catch (e: any) {
      showSnackbar(`Failed to delete account: ${e?.message || e}`, 'error');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }, [deleteConfirmation, navigate, showSnackbar]);

  // Logout handler
  const handleLogout = useCallback(() => {
    pb.authStore.clear();
    showSnackbar('You have been logged out', 'info');
    navigate('/login');
  }, [navigate, showSnackbar]);

  // Memoized profile display
  const profileDisplay = useMemo(() => (
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
  ), [profile]);

  if (loading) {
    return (
      <Box sx={{ p: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
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
                <Button startIcon={<EditIcon />} onClick={handleEditProfile}>
                  Edit
                </Button>
              ) : (
                <Box>
                  <Button
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    sx={{ mr: 1 }}
                    disabled={savingProfile}
                  >
                    {savingProfile ? 'Saving…' : 'Save'}
                  </Button>
                  <Button color="inherit" onClick={handleCancelEdit} disabled={savingProfile}>
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar sx={{ width: 100, height: 100, mb: 2 }} src={profile.avatarUrl}>
                  {profile.name?.charAt(0)}
                </Avatar>
                {editMode && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={onAvatarFileSelected}
                    />
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={onClickChangePhoto} 
                      startIcon={<UploadIcon />} 
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? 'Uploading…' : 'Change Photo'}
                    </Button>
                  </>
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
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color="action" />
                            </InputAdornment>
                          ),
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
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
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
                          startAdornment: (
                            <InputAdornment position="start">
                              <SchoolIcon color="action" />
                            </InputAdornment>
                          ),
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
                          onChange={handleYearChange}
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
                ) : profileDisplay}
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
                <Switch edge="end" checked={darkMode} onChange={handleDarkModeToggle} />
              </ListItem>
              <Divider component="li" />

              <ListItem>
                <ListItemText
                  primary="Language"
                  secondary="Select your preferred language"
                />
                <FormControl sx={{ minWidth: 140 }} size="small">
                  <Select
                    value={language}
                    onChange={handleLanguageChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Language' }}
                  >
                    <MenuItem value="en">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LanguageIcon fontSize="small" sx={{ mr: 1 }} />
                        English
                      </Box>
                    </MenuItem>
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
          <Button onClick={() => setPasswordDialogOpen(false)} disabled={savingPassword}>Cancel</Button>
          <Button onClick={handleSavePassword} variant="contained" disabled={savingPassword}>
            {savingPassword ? 'Updating…' : 'Update Password'}
          </Button>
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
            To confirm, please type "{DELETE_CONFIRMATION_TEXT}" below:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            variant="outlined"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={deleteConfirmation !== DELETE_CONFIRMATION_TEXT || deleting}
          >
            {deleting ? 'Deleting…' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}