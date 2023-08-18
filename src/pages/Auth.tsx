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

const Auth: Component = () => {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const { login } = useAuth();

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    const data = { email: email(), password: password() };
    setError("");
    setLoading(true);
    const { error, accessToken } = await authorize(data);
    if (error.length > 0) {
      setError(error);
    } else {
      setError("");
      login(accessToken);
    }
    setLoading(false);
  };

  return (
    <Container
      sx={{
        display: "flex",
        justifyContent: "center",
        mt: 10,
      }}
    >
      <Stack sx={{ width: "30ch" }}>
        <Typography variant="h4" mb={2}>
          AudioNotes
        </Typography>
        <Stack component="form" gap={2} onSubmit={onSubmit}>
          <TextField
            required
            name="email"
            label="email"
            value={email()}
            onChange={(_, value) => setEmail(value)}
            type="email"
            sx={{ bgcolor: "#fff" }}
          />
          <TextField
            required
            name="password"
            label="password"
            value={password()}
            onChange={(_, value) => setPassword(value)}
            type="password"
            sx={{ bgcolor: "#fff" }}
          />
          <Show when={error().length > 0}>
            <Alert severity="error">{error()}</Alert>
          </Show>
          <Show when={!loading()} fallback={<LinearProgress />}>
            <Stack direction="row" gap={1} alignItems="center">
              <Button type="submit" variant="contained">
                Log in
              </Button>
              <Link href="#">forgot password?</Link>
            </Stack>
          </Show>
        </Stack>
      </Stack>
    </Container>
  );
};

export default Auth;
