import {
  Alert,
  Button,
  Container,
  LinearProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from "@suid/material";
import { Component, Show, createSignal } from "solid-js";
import { authorize } from "../api";
import { useAuth } from "../auth";
import { A, Navigate, useLocation } from "@solidjs/router";

const Auth: Component = () => {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const { login, accessToken } = useAuth();
  const location = useLocation();

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    const data = { email: email(), password: password() };
    setError("");
    setLoading(true);
    const { error, accessToken } = await authorize(data);
    if (accessToken !== null && accessToken.length > 0) {
      setError("");
      login(accessToken);
    } else {
      setError(error);
    }
    setLoading(false);
  };

  return (
    <Show
      when={!accessToken()}
      fallback={<Navigate href={(location.state as any)?.next || "/"} />}
    >
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 20,
        }}
      >
        <Stack width="30ch" spacing={2}>
          <Typography variant="h4">AudioNotes</Typography>
          <Stack component="form" spacing={2} onSubmit={onSubmit}>
            <TextField
              required
              type="email"
              name="email"
              label="email"
              value={email()}
              onChange={(_, value) => setEmail(value)}
              sx={{ bgcolor: "#fff" }}
            />
            <TextField
              required
              type="password"
              name="password"
              label="password"
              value={password()}
              onChange={(_, value) => setPassword(value)}
              sx={{ bgcolor: "#fff" }}
            />
            <Show when={error()}>
              <Alert severity="error">{error()}</Alert>
            </Show>
            <Show when={!loading()} fallback={<LinearProgress />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button type="submit" variant="contained">
                  Log in
                </Button>
                <Link href="/reset-password" component={A}>
                  Forgot password?
                </Link>
              </Stack>
            </Show>
          </Stack>
        </Stack>
      </Container>
    </Show>
  );
};

export default Auth;
