import { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Button, Paper, useTheme } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import pb from "../lib/pocketbase";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const token = searchParams.get("token");
        if (!token) {
            setStatus("error");
            setMessage("No verification token found in the link.");
            return;
        }

        pb.collection("users")
            .confirmVerification(token)
            .then(() => {
                setStatus("success");
                setMessage("Your email has been verified! You can now log in.");
            })
            .catch((err) => {
                setStatus("error");
                setMessage(err?.message || "Verification failed. The link may have expired.");
            });
    }, [searchParams]);

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
            bgcolor={theme.palette.background.default}
        >
            <Paper elevation={3} sx={{ p: 5, maxWidth: 420, width: "100%", textAlign: "center", borderRadius: 3 }}>
                <Typography variant="h5" fontWeight={700} mb={2}>
                    RPI Dorm Room Helper
                </Typography>

                {status === "loading" && (
                    <>
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography color="text.secondary">Verifying your email...</Typography>
                    </>
                )}

                {status === "success" && (
                    <>
                        <Typography fontSize={48} mb={1}>✅</Typography>
                        <Typography variant="h6" fontWeight={600} mb={1}>Email Verified!</Typography>
                        <Typography color="text.secondary" mb={3}>{message}</Typography>
                        <Button variant="contained" fullWidth onClick={() => navigate("/login")}>
                            Go to Login
                        </Button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <Typography fontSize={48} mb={1}>❌</Typography>
                        <Typography variant="h6" fontWeight={600} mb={1}>Verification Failed</Typography>
                        <Typography color="text.secondary" mb={3}>{message}</Typography>
                        <Button variant="outlined" fullWidth onClick={() => navigate("/login")}>
                            Back to Login
                        </Button>
                    </>
                )}
            </Paper>
        </Box>
    );
}
