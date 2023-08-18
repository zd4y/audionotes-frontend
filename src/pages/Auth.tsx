import { Box, Button, Container, Link, Stack, TextField, Typography } from "@suid/material";
import { Component, createSignal } from "solid-js";

const Auth: Component = () => {
  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")

  return (
    <Container sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 10 }}>
      <Typography variant="h4" mb={3}>AudioNotes</Typography>
      <Stack component="form" alignItems="flex-start" gap={1}>
        <TextField required name="email" label="email" sx={{ width: "30ch" }} value={email()} onChange={(_, value) => setEmail(value)} type="email" />
        <TextField required name="password" label="password" sx={{ width: "30ch" }} value={password()} onChange={(_, value) => setPassword(value)} type="password" />
        <Stack direction="row" gap={1} alignItems="center">
          <Button type="submit" variant="contained">Log in</Button>
          <Link href="#">forgot your password?</Link>
        </Stack>
      </Stack>
    </Container>
  );
};

export default Auth;
