import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import pb from "../lib/pocketbase";

function readToken(searchParams: URLSearchParams): string {
  return (
    searchParams.get("token") ||
    searchParams.get("passwordResetToken") ||
    ""
  ).trim();
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => readToken(searchParams), [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const submitReset = async () => {
    if (!token) {
      setStatus({
        type: "error",
        message: "Missing reset token in URL. Please use the full email link.",
      });
      return;
    }

    if (password.length < 8) {
      setStatus({
        type: "error",
        message: "Password must be at least 8 characters.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({
        type: "error",
        message: "Password confirmation does not match.",
      });
      return;
    }

    setLoading(true);
    setStatus({ type: "idle", message: "" });

    try {
      await pb.collection("users").confirmPasswordReset(token, password, confirmPassword);
      setStatus({
        type: "success",
        message: "Password has been reset. You can now sign in.",
      });
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err?.message || "Reset failed. The link may be expired.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Paper sx={{ p: 4, width: "100%", maxWidth: 460 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Reset Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter a new password for your account.
        </Typography>

        {!!status.message && (
          <Alert severity={status.type === "success" ? "success" : "error"} sx={{ mb: 2 }}>
            {status.message}
          </Alert>
        )}

        <TextField
          fullWidth
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading}
        />
        <TextField
          fullWidth
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={{ mb: 3 }}
          disabled={loading}
        />

        <Button fullWidth variant="contained" onClick={submitReset} disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </Paper>
    </Box>
  );
}
