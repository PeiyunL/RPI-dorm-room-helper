import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  FormControlLabel,
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
  CircularProgress
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

// ----- CONFIG: change this to 'profiles' if you store custom fields elsewhere -----
const USERS_COLLECTION = 'users';

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

// Fields persisted in backend (users collection)
// Add/remove keys to match your schema.
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

export default function Setting() {
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
  const navigate = useNavigate();

  // Settings states
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [appNotifications, setAppNotifications] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>(() => localStorage.getItem('i18n_lang') || 'en');

  // For editing profile
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // For password change
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState<boolean>(false);

  // For account deletion
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>('');
  const [deleting, setDeleting] = useState<boolean>(false);

  // For notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // Avatar input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);

  // Apply dark mode to the document (minimal real effect)
  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Load current user & settings
  useEffect(() => {
    const user = pb.authStore.model;
    if (!user) {
      navigate('/login');
      return;
    }

    // Merge existing fields with defaults
    const avatarUrl = user.avatar
      ? pb.files.getUrl(user, user.avatar, { thumb: '100x100' })
      : '';

    setProfile({
      name: user.name || '',
      email: user.email || '',
      phone: (user as any).phone || '',
      major: (user as any).major || '',
      year: (user as any).year || '',
      bio: (user as any).bio || '',
      avatarUrl,
    });

    // Settings (with fallback defaults)
    setEmailNotifications(Boolean((user as any).emailNotifications ?? true));
    setAppNotifications(Boolean((user as any).appNotifications ?? true));
    setLanguage(((user as any).language as string) || localStorage.getItem('i18n_lang') || 'en');
    setDarkMode(Boolean((user as any).darkMode ?? (localStorage.getItem('theme') === 'dark')));

    setLoading(false);
  }, [navigate]);

  // Helpers
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  const currentUserId = useMemo(() => pb.authStore.model?.id, []);

  const updateUser = async (fields: Partial<PersistedSettings & { avatar?: File }>) => {
    if (!currentUserId) throw new Error('Not authenticated');

    // If avatar is included, use FormData
    if (fields.avatar) {
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => {
        if (k === 'avatar' && v instanceof File) fd.append('avatar', v);
        else if (typeof v !== 'undefined') fd.append(k, String(v));
      });
      const rec = await pb.collection(USERS_COLLECTION).update(currentUserId, fd);
      return rec;
    } else {
      const rec = await pb.collection(USERS_COLLECTION).update(currentUserId, fields);
      return rec;
    }
  };

  // ----- Appearance & Language -----
  const handleLanguageChange = async (event: SelectChangeEvent) => {
    const value = event.target.value as string;
    setLanguage(value);
    localStorage.setItem('i18n_lang', value);
    try {
      await updateUser({ language: value });
      showSnackbar('Language preference updated', 'success');
    } catch (e: any) {
      showSnackbar(`Failed to update language: ${e?.message || e}`, 'error');
    }
  };

  const handleDarkModeToggle = async () => {
    const next = !darkMode;
    setDarkMode(next);
    try {
      await updateUser({ darkMode: next });
      showSnackbar(`Dark mode ${next ? 'enabled' : 'disabled'}`, 'success');
    } catch (e: any) {
      showSnackbar(`Failed to save theme: ${e?.message || e}`, 'error');
    }
  };

  // ----- Notifications -----
  const handleEmailNotificationsToggle = async () => {
    const next = !emailNotifications;
    setEmailNotifications(next);
    try {
      await updateUser({ emailNotifications: next });
      showSnackbar(`Email notifications ${next ? 'enabled' : 'disabled'}`, 'success');
    } catch (e: any) {
      showSnackbar(`Failed to save email notifications: ${e?.message || e}`, 'error');
    }
  };

  const handleAppNotificationsToggle = async () => {
    const next = !appNotifications;
    setAppNotifications(next);
    try {
      await updateUser({ appNotifications: next });
      showSnackbar(`App notifications ${next ? 'enabled' : 'disabled'}`, 'success');
    } catch (e: any) {
      showSnackbar(`Failed to save app notifications: ${e?.message || e}`, 'error');
    }
  };

  // ----- Profile edit -----
  const handleEditProfile = () => {
    setEditMode(true);
    setEditedProfile({ ...profile });
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
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

      // Refresh avatar url & local state from record
      const avatarUrl = rec.avatar
        ? pb.files.getUrl(rec, rec.avatar, { thumb: '100x100' })
        : '';

      setProfile({
        ...editedProfile,
        avatarUrl,
      });
      setEditMode(false);
      showSnackbar('Profile updated successfully', 'success');
    } catch (e: any) {
      showSnackbar(`Failed to update profile: ${e?.message || e}`, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedProfile(profile);
  };

  // ----- Avatar upload -----
  const onClickChangePhoto = () => fileInputRef.current?.click();

  const onAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const rec = await updateUser({ avatar: file });
      const url = rec.avatar ? pb.files.getUrl(rec, rec.avatar, { thumb: '100x100' }) : '';
      setProfile(p => ({ ...p, avatarUrl: url }));
      if (editMode) setEditedProfile(p => ({ ...p, avatarUrl: url }));
      showSnackbar('Avatar updated', 'success');
    } catch (err: any) {
      showSnackbar(`Failed to upload avatar: ${err?.message || err}`, 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ----- Password change -----
  const handleOpenPasswordDialog = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordDialogOpen(true);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar('New passwords do not match', 'error');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showSnackbar('Password must be at least 8 characters', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      // PocketBase: supply oldPassword + password + passwordConfirm in update.
      await updateUser({
        // @ts-ignore - PocketBase accepts these special fields for auth updates
        oldPassword: passwordData.currentPassword as any,
        password: passwordData.newPassword as any,
        passwordConfirm: passwordData.confirmPassword as any,
      } as any);

      setPasswordDialogOpen(false);
      showSnackbar('Password updated successfully', 'success');
    } catch (e: any) {
      showSnackbar(`Failed to update password: ${e?.message || e}`, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // ----- Delete account -----
  const handleOpenDeleteDialog = () => {
    setDeleteConfirmation('');
    setDeleteDialogOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'delete my account') return;
    if (!currentUserId) return;

    setDeleting(true);
    try {
      await pb.collection(USERS_COLLECTION).delete(currentUserId);
      pb.authStore.clear();
      showSnackbar('Account deleted', 'info');
      navigate('/login');
    } catch (e: any) {
      showSnackbar(`Failed to delete account: ${e?.message || e}`, 'error');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // ----- Logout -----
  const handleLogout = () => {
    pb.authStore.clear();
    showSnackbar('You have been logged out', 'info');
    navigate('/login');
  };

  if (loading) {
    return (
      <Box sx={{ p: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

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
                      <Button size="small" variant="outlined" onClick={onClickChangePhoto} startIcon={<UploadIcon />} disabled={uploadingAvatar}>
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
                          InputProps={{ startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} /> }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          name="phone"
                          value={editedProfile.phone}
                          onChange={handleProfileChange}
                          InputProps={{ startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} /> }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Major"
                          name="major"
                          value={editedProfile.major}
                          onChange={handleProfileChange}
                          InputProps={{ startAdornment: <SchoolIcon color="action" sx={{ mr: 1 }} /> }}
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
                            onChange={(e) => setEditedProfile({ ...editedProfile, year: e.target.value })}
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
                        <LanguageIcon fontSize="small" sx={{ mr: 1 }} />
                        English
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
              To confirm, please type "delete my account" below:
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
              disabled={deleteConfirmation !== 'delete my account' || deleting}
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
    </div>
  );
}
