import { Box, Typography, TextField, Button, Alert, Snackbar } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import pb from '../lib/pocketbase.js';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
        // ✅ Redirect if already authenticated
    useEffect(() => {
        if (pb.authStore.isValid) {
            navigate('/homepage', { replace: true });
        }
    }, [navigate])

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            await pb.collection('users').authWithPassword(email, password);
            // Redirect manually since we're not using a global auth observer here
            navigate('/homepage', { replace: true });
        } catch (error) {
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="80vh">
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                Welcome
            </Typography>
    
            {error && (
                <Alert severity="error" sx={{ width: '100%', maxWidth: 500, mb: 2 }}>
                    {error}
                </Alert>
            )}
    
            <Box onSubmit={handleSubmit} component="form" display="flex" flexDirection="column" gap={2} width={500}>
                <TextField 
                    fullWidth 
                    label="Email" 
                    type="email" 
                    variant="outlined" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                />
                <TextField 
                    fullWidth 
                    label="Password" 
                    type="password" 
                    variant="outlined" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />
                <Button 
                    variant="contained" 
                    type="submit" 
                    fullWidth
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </Button>
            </Box>
        </Box>
    );
}