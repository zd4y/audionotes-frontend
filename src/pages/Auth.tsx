import { Box, Container, TextField } from "@suid/material";
import { Component } from "solid-js";

const Auth: Component = () => {
  return (
    <Container>
      <Box component="form">
        <TextField required label="username" />
        <TextField required label="password" />
      </Box>
    </Container>
  );
};

export default Auth;
