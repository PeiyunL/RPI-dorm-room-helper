import { Box, Typography, TextField, Button } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";
// import useUsers from "../hooks/useUsers";

export default function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate(); 
    // const { login } = useUsers();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log('Form submitted', email, password);

        // await login(email, password);
        setTimeout(() => {
            navigate('/homepage');
        }, 1000);
    };
    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="80vh">
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>Welcome</Typography>
            <Box onSubmit={handleSubmit} component="form" display="flex" flexDirection="column" gap={2} width={500} >
                <Box>
                    <TextField fullWidth id="outlined-basic" label="Email" type="email" variant="outlined" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </Box>
                <Box>
                    <TextField fullWidth id="outlined-basic" label="Password" type="password" variant="outlined" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </Box>
                <Box>
                    <Button variant="contained" type="submit" fullWidth>Login</Button>
                </Box>
            </Box>
        </Box>
    );
}
