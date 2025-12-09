import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    Snackbar,
    IconButton,
    InputAdornment,
    LinearProgress,
    Paper,
    Divider,
    Link,
    useTheme,
    useMediaQuery,
    Collapse,
    Stack
} from "@mui/material";
import {
    Visibility,
    VisibilityOff,
    Email as EmailIcon,
    Lock as LockIcon,
    Google as GoogleIcon,
    GitHub as GitHubIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon
} from "@mui/icons-material";
import pb from '../lib/pocketbase';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordConfirmError, setPasswordConfirmError] = useState('');
    
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Redirect if already authenticated
    useEffect(() => {
        if (pb.authStore.isValid) {
            navigate('/homepage', { replace: true });
        }
    }, [navigate]);

    const generateToken = (length: number): string => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }
        return token;
    };

    // Email validation
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('Email is required');
            return false;
        }
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    // Password validation
    const validatePassword = (password: string): boolean => {
        if (!password) {
            setPasswordError('Password is required');
            return false;
        }
        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return false;
        }
        setPasswordError('');
        return true;
    };

    // Password confirmation validation
    const validatePasswordConfirm = (passwordConfirm: string): boolean => {
        if (!passwordConfirm) {
            setPasswordConfirmError('Please confirm your password');
            return false;
        }
        if (password !== passwordConfirm) {
            setPasswordConfirmError('Passwords do not match');
            return false;
        }
        setPasswordConfirmError('');
        return true;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate inputs
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        const isPasswordConfirmValid = validatePasswordConfirm(passwordConfirm);
        
        if (!isEmailValid || !isPasswordValid || !isPasswordConfirmValid) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const tokenKey = generateToken(50);
            await pb.collection('users').create({
                email,
                password,
                passwordConfirm: passwordConfirm,
                tokenKey: tokenKey,
            });
            
            setSuccessMessage('✅ Registered successfully! Redirecting to login...');
            
            setTimeout(() => {
                navigate('/login');
            }, 1500);

        } catch (error: any) {
            console.error('Registration error:', error);
            
            // Handle specific error types
            if (error?.data?.email) {
                setError('This email is already registered.');
            } else if (error?.status === 400) {
                setError('Invalid registration data. Please check your inputs.');
            } else if (error?.message?.includes('network')) {
                setError('Network error. Please check your connection.');
            } else {
                setError(`Registration failed: ${error.message || 'Please try again.'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthRegister = async (provider: 'google' | 'github') => {
        setLoading(true);
        setError('');

        try {
            const authData = await pb.collection('users').authWithOAuth2({ provider });
            
            setSuccessMessage(`Successfully registered with ${provider}!`);
            
            setTimeout(() => {
                navigate('/homepage', { replace: true });
            }, 1000);
        } catch (error: any) {
            console.error(`OAuth ${provider} error:`, error);
            setError(`Failed to register with ${provider}. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            minHeight="100vh"
            sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: 2
            }}
        >
            {loading && (
                <LinearProgress 
                    sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0,
                        zIndex: 1000
                    }} 
                />
            )}

            <Paper
                elevation={10}
                sx={{
                    p: 4,
                    width: '100%',
                    maxWidth: isMobile ? '100%' : 500,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)'
                }}
            >
                <Box textAlign="center" mb={3}>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            fontWeight: 'bold', 
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1
                        }}
                    >
                        Create Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Sign up for your RPI Housing account
                    </Typography>
                </Box>

                {/* Success/Error Messages */}
                <Collapse in={!!error}>
                    <Alert 
                        severity="error" 
                        sx={{ mb: 2 }}
                        icon={<ErrorIcon />}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                </Collapse>

                <Collapse in={!!successMessage}>
                    <Alert 
                        severity="success" 
                        sx={{ mb: 2 }}
                        icon={<CheckCircleIcon />}
                    >
                        {successMessage}
                    </Alert>
                </Collapse>

                {/* Registration Form */}
                <Box 
                    component="form" 
                    onSubmit={handleRegister} 
                    display="flex" 
                    flexDirection="column" 
                    gap={2}
                >
                    <TextField 
                        fullWidth 
                        label="Email Address" 
                        type="email" 
                        variant="outlined" 
                        required 
                        value={email} 
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) validateEmail(e.target.value);
                        }}
                        onBlur={() => validateEmail(email)}
                        error={!!emailError}
                        helperText={emailError}
                        disabled={loading}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                        autoComplete="email"
                        autoFocus
                    />
                    
                    <TextField 
                        fullWidth 
                        label="Password" 
                        type={showPassword ? 'text' : 'password'}
                        variant="outlined" 
                        required 
                        value={password} 
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (passwordError) validatePassword(e.target.value);
                            if (passwordConfirm) validatePasswordConfirm(passwordConfirm);
                        }}
                        onBlur={() => validatePassword(password)}
                        error={!!passwordError}
                        helperText={passwordError || 'Must be at least 8 characters'}
                        disabled={loading}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        disabled={loading}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        autoComplete="new-password"
                    />

                    <TextField 
                        fullWidth 
                        label="Confirm Password" 
                        type={showPasswordConfirm ? 'text' : 'password'}
                        variant="outlined" 
                        required 
                        value={passwordConfirm} 
                        onChange={(e) => {
                            setPasswordConfirm(e.target.value);
                            if (passwordConfirmError) validatePasswordConfirm(e.target.value);
                        }}
                        onBlur={() => validatePasswordConfirm(passwordConfirm)}
                        error={!!passwordConfirmError}
                        helperText={passwordConfirmError}
                        disabled={loading}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                        edge="end"
                                        disabled={loading}
                                    >
                                        {showPasswordConfirm ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        autoComplete="new-password"
                    />

                    <Button 
                        variant="contained" 
                        type="submit" 
                        fullWidth
                        size="large"
                        disabled={loading}
                        sx={{
                            py: 1.5,
                            mt: 1,
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #5a67d8, #6b4199)',
                            }
                        }}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                </Box>

                {/* OAuth Options */}
                <Divider sx={{ my: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        OR
                    </Typography>
                </Divider>

                <Stack spacing={2}>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<GoogleIcon />}
                        onClick={() => handleOAuthRegister('google')}
                        disabled={loading}
                        sx={{ textTransform: 'none' }}
                    >
                        Continue with Google
                    </Button>
                    
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<GitHubIcon />}
                        onClick={() => handleOAuthRegister('github')}
                        disabled={loading}
                        sx={{ textTransform: 'none' }}
                    >
                        Continue with GitHub
                    </Button>
                </Stack>

                {/* Login Link */}
                <Box textAlign="center" mt={3}>
                    <Typography variant="body2" color="text.secondary">
                        Already have an account?{' '}
                        <Link
                            component="button"
                            variant="body2"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/login');
                            }}
                            disabled={loading}
                            sx={{ 
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                color: 'primary.main'
                            }}
                        >
                            Sign in here
                        </Link>
                    </Typography>
                </Box>
            </Paper>

            {/* Snackbar for notifications */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Register;