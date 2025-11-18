"use client";
import { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Paper, Switch, FormControlLabel, Avatar } from "@mui/material";
import { getAll, put } from "@/lib/db";
import type { SettingsProfile, AuthState } from "@/lib/models";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";

export default function SettingsPage() {
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [password, setPassword] = useState("");
  const [qr, setQr] = useState<string>("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    (async () => {
      const [p] = await getAll<SettingsProfile>("settings");
      setProfile(p || { id: "profile", firmName: "Your Firm", currency: "INR", dateFormat: "YYYY-MM-DD" });
      const [a] = await getAll<AuthState>("auth");
      setAuth(a || { id: "auth", twoFaEnabled: false });
    })();
  }, []);

  async function saveProfile() {
    if (!profile) return;
    await put("settings", profile);
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfile((s) => (s ? { ...s, logoDataUrl: String(reader.result) } : s));
    reader.readAsDataURL(file);
  }

  async function setNewPassword() {
    if (!password) return;
    const hash = bcrypt.hashSync(password, 10);
    const next: AuthState = { id: "auth", twoFaEnabled: auth?.twoFaEnabled || false, totpSecret: auth?.totpSecret, passwordHash: hash };
    await put("auth", next);
    setAuth(next);
    setPassword("");
  }

  async function toggle2FA(enabled: boolean) {
    if (!enabled) {
      const next: AuthState = { id: "auth", twoFaEnabled: false };
      await put("auth", next);
      setAuth(next);
      setQr("");
      setOtp("");
    } else {
      const secret = authenticator.generateSecret();
      const otpauth = authenticator.keyuri(profile?.firmName || "YOUREKA", "YOUREKA", secret);
      const code = await QRCode.toDataURL(otpauth);
      setQr(code);
      const next: AuthState = { id: "auth", twoFaEnabled: true, totpSecret: secret, passwordHash: auth?.passwordHash };
      await put("auth", next);
      setAuth(next);
    }
  }

  function verifyOtp() {
    if (!auth?.totpSecret) return;
    const valid = authenticator.check(otp, auth.totpSecret);
    alert(valid ? "2FA code valid" : "Invalid code");
    setOtp("");
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Settings</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
          <TextField fullWidth label="Firm Name" value={profile?.firmName || ""} onChange={(e) => setProfile((s) => (s ? { ...s, firmName: e.target.value } : s))} />
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar src={profile?.logoDataUrl} alt="Company logo" sx={{ width: 56, height: 56 }} />
            <Button variant="outlined" component="label">Upload Logo<input hidden type="file" accept="image/*" onChange={uploadLogo} /></Button>
          </Box>
          <TextField fullWidth label="Address" value={profile?.address || ""} onChange={(e) => setProfile((s) => (s ? { ...s, address: e.target.value } : s))} sx={{ gridColumn: '1 / -1' }} />
          <TextField fullWidth label="GSTIN" value={profile?.gstin || ""} onChange={(e) => setProfile((s) => (s ? { ...s, gstin: e.target.value } : s))} />
          <TextField fullWidth label="Currency" value={profile?.currency || "INR"} onChange={(e) => setProfile((s) => (s ? { ...s, currency: e.target.value } : s))} />
          <TextField fullWidth label="Date Format" value={profile?.dateFormat || "YYYY-MM-DD"} onChange={(e) => setProfile((s) => (s ? { ...s, dateFormat: e.target.value } : s))} />
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Button variant="contained" onClick={saveProfile}>Save Profile</Button>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Security</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2 }}>
          <TextField fullWidth label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button variant="outlined" onClick={setNewPassword}>Set Password</Button>
          <FormControlLabel control={<Switch checked={!!auth?.twoFaEnabled} onChange={(e) => toggle2FA(e.target.checked)} />} label="Enable 2FA" />
        </Box>
        {auth?.twoFaEnabled && qr && (
          <Box sx={{ mt: 2 }}>
            <img src={qr} alt="2FA QR" />
            <Box mt={1} display="flex" gap={1} alignItems="center">
              <TextField label="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
              <Button onClick={verifyOtp}>Verify</Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
