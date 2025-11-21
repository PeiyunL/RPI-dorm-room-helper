import { 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Alert, 
    Snackbar,
    Checkbox,
    FormControlLabel,
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
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import pb from '../lib/pocketbase.js';

interface LocationState {
    from?: string;
    message?: string;
}

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // Get redirect location from navigation state
    const state = location.state as LocationState;
    const from = state?.from || '/homepage';

    // Check for stored credentials on mount
    useEffect(() => {
        const storedEmail = localStorage.getItem('rememberedEmail');
        if (storedEmail) {
            setEmail(storedEmail);
            setRememberMe(true);
        }
        
        // Show message if redirected from protected route
        if (state?.message) {
            setError(state.message);
        }
    }, [state]);

    // Redirect if already authenticated
    useEffect(() => {
        if (pb.authStore.isValid) {
            navigate(from, { replace: true });
        }
    }, [navigate, from]);

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
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        // Validate inputs
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        
        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Authenticate with PocketBase
            const authData = await pb.collection('users').authWithPassword(email, password);
            
            // Store email if remember me is checked
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            // Set success message
            setSuccessMessage('Login successful! Redirecting...');
            
            // Log activity
            try {
                await pb.collection('login_logs').create({
                    user: authData.record.id,
                    timestamp: new Date().toISOString(),
                    ip: await fetch('https://api.ipify.org?format=json')
                        .then(res => res.json())
                        .then(data => data.ip)
                        .catch(() => 'unknown'),
                    userAgent: navigator.userAgent
                });
            } catch (logError) {
                console.error('Failed to log login activity:', logError);
            }
            
            // Delay for success message visibility
            setTimeout(() => {
                navigate(from, { replace: true });
            }, 1000);
            
        } catch (error: any) {
            console.error('Login error:', error);
            
            // Handle specific error types
            if (error?.status === 400) {
                setError('Invalid email or password. Please try again.');
            } else if (error?.status === 429) {
                setError('Too many login attempts. Please try again later.');
            } else if (error?.message?.includes('network')) {
                setError('Network error. Please check your connection.');
            } else {
                setError('Login failed. Please try again.');
            }
            
            // Clear password on error
            setPassword('');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!validateEmail(resetEmail)) {
            return;
        }

        setResetLoading(true);
        setError('');

        try {
            await pb.collection('users').requestPasswordReset(resetEmail);
            setResetSuccess(true);
            setSuccessMessage('Password reset email sent! Check your inbox.');
            
            // Close forgot password form after 3 seconds
            setTimeout(() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setResetSuccess(false);
            }, 3000);
        } catch (error: any) {
            console.error('Password reset error:', error);
            setError('Failed to send reset email. Please verify your email address.');
        } finally {
            setResetLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        setLoading(true);
        setError('');

        try {
            // OAuth authentication with PocketBase
            const authData = await pb.collection('users').authWithOAuth2({ provider });
            
            setSuccessMessage(`Successfully logged in with ${provider}!`);
            
            setTimeout(() => {
                navigate(from, { replace: true });
            }, 1000);
        } catch (error: any) {
            console.error(`OAuth ${provider} error:`, error);
            setError(`Failed to login with ${provider}. Please try again.`);
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
                        Welcome Back
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Sign in to access your RPI Housing account
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

                {/* Main Login Form */}
                <Collapse in={!showForgotPassword}>
                    <Box 
                        component="form" 
                        onSubmit={handleSubmit} 
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
                            }}
                            onBlur={() => validatePassword(password)}
                            error={!!passwordError}
                            helperText={passwordError}
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
                            autoComplete="current-password"
                        />

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <FormControlLabel
                                control={
                                    <Checkbox 
                                        checked={rememberMe} 
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        disabled={loading}
                                        color="primary"
                                    />
                                }
                                label="Remember me"
                            />
                            
                            <Link
                                component="button"
                                variant="body2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowForgotPassword(true);
                                    setResetEmail(email);
                                }}
                                disabled={loading}
                                sx={{ textDecoration: 'none' }}
                            >
                                Forgot password?
                            </Link>
                        </Box>

                        <Button 
                            variant="contained" 
                            type="submit" 
                            fullWidth
                            size="large"
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #5a67d8, #6b4199)',
                                }
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </Box>
                </Collapse>

                {/* Forgot Password Form */}
                <Collapse in={showForgotPassword}>
                    <Box display="flex" flexDirection="column" gap={2}>
                        <Typography variant="h6" textAlign="center">
                            Reset Password
                        </Typography>
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            Enter your email address and we'll send you a reset link
                        </Typography>
                        
                        <TextField 
                            fullWidth 
                            label="Email Address" 
                            type="email" 
                            variant="outlined" 
                            required 
                            value={resetEmail} 
                            onChange={(e) => setResetEmail(e.target.value)}
                            error={!!emailError}
                            helperText={emailError}
                            disabled={resetLoading || resetSuccess}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setResetEmail('');
                                    setEmailError('');
                                }}
                                disabled={resetLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleForgotPassword}
                                disabled={resetLoading || resetSuccess}
                            >
                                {resetLoading ? 'Sending...' : resetSuccess ? 'Sent!' : 'Send Reset Link'}
                            </Button>
                        </Stack>
                    </Box>
                </Collapse>

                {/* OAuth and Registration */}
                {!showForgotPassword && (
                    <>
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
                                onClick={() => handleOAuthLogin('google')}
                                disabled={loading}
                                sx={{ textTransform: 'none' }}
                            >
                                Continue with Google
                            </Button>
                            
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<GitHubIcon />}
                                onClick={() => handleOAuthLogin('github')}
                                disabled={loading}
                                sx={{ textTransform: 'none' }}
                            >
                                Continue with GitHub
                            </Button>
                        </Stack>

                        <Box textAlign="center" mt={3}>
                            <Typography variant="body2" color="text.secondary">
                                Don't have an account?{' '}
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate('/register');
                                    }}
                                    disabled={loading}
                                    sx={{ 
                                        textDecoration: 'none',
                                        fontWeight: 'bold',
                                        color: 'primary.main'
                                    }}
                                >
                                    Sign up now
                                </Link>
                            </Typography>
                        </Box>
                    </>
                )}
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
}