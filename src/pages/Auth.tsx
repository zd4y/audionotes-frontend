import {
  Box,
  Button,
  Container,
  Link,
  Stack,
  TextField,
  Typography,
} from "@suid/material";
import { Component, createSignal } from "solid-js";

const Auth: Component = () => {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");

  const onSubmit = (async (e: Event) => {
    e.preventDefault()
    const data = { email: email(), password: password() };
    const res = await fetch("http://127.0.0.1:8000/api/user/authorize", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log(res);
  })

  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mt: 10,
      }}
    >
      <Typography variant="h4" mb={3}>
        AudioNotes
      </Typography>
      <Stack component="form" alignItems="flex-start" gap={1} onSubmit={onSubmit}>
        <TextField
          required
          name="email"
          label="email"
          sx={{ width: "30ch" }}
          value={email()}
          onChange={(_, value) => setEmail(value)}
          type="email"
        />
        <TextField
          required
          name="password"
          label="password"
          sx={{ width: "30ch" }}
          value={password()}
          onChange={(_, value) => setPassword(value)}
          type="password"
        />
        <Stack direction="row" gap={1} alignItems="center">
          <Button type="submit" variant="contained">
            Log in
          </Button>
          <Link href="#">forgot your password?</Link>
        </Stack>
      </Stack>
    </Container>
  );
};

export default Auth;
