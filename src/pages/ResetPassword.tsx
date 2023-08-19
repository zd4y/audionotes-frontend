import {
  Alert,
  AlertTitle,
  Button,
  Container,
  LinearProgress,
  Link,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
} from "@suid/material";
import { For, Show, createSignal, onMount } from "solid-js";
import { requestResetPassword, resetPassword } from "../api";
import { A, useSearchParams } from "@solidjs/router";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = createSignal("");
  const [successMsg, setSuccessMsg] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [newPassword, setNewPassword] = createSignal("");
  const [confirmNewPassword, setConfirmNewPassword] = createSignal("");
  const [warning, setWarning] = createSignal("");
  const [suggestions, setSuggestions] = createSignal<string[]>([]);

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    setSuccessMsg("");
    setLoading(true);
    setError("");
    setWarning("");
    setSuggestions([]);
    if (searchParams.token && searchParams.user_id) {
      if (newPassword() !== confirmNewPassword()) {
        setError("Passwords don't match.");
        setLoading(false);
        return;
      }
      const data = {
        user_id: parseInt(searchParams.user_id),
        token: searchParams.token,
        new_password: newPassword(),
      };
      const { reset, error, warning, suggestions } = await resetPassword(data);
      if (reset) {
        setSuccessMsg("Password reset, you may now log in.");
      } else {
        setError(error);
        setWarning(warning);
        setSuggestions(suggestions);
      }
      setLoading(false);
    } else {
      const { sent, error } = await requestResetPassword(email());
      if (sent) {
        setSuccessMsg(
          "If an account with that email exists, an email will be sent with a reset link.",
        );
      } else {
        setError(error);
      }
      setLoading(false);
    }
  };

  return (
    <Container sx={{ display: "flex", justifyContent: "center", mt: 20 }}>
      <Stack gap={2} width="30ch">
        <Typography variant="h4">AudioNotes</Typography>
        <Stack component="form" gap={2} onSubmit={onSubmit}>
          <Show
            when={searchParams.token}
            fallback={
              <TextField
                required
                type="email"
                name="email"
                label="email"
                value={email()}
                onChange={(_, value) => setEmail(value)}
                sx={{ bgcolor: "#fff" }}
              />
            }
          >
            <TextField
              required
              type="password"
              name="new_password"
              label="new password"
              value={newPassword()}
              onChange={(_, value) => setNewPassword(value)}
              sx={{ bgcolor: "#fff" }}
            />
            <TextField
              type="password"
              name="confirm_new_password"
              label="confirm new password"
              value={confirmNewPassword()}
              onChange={(_, value) => setConfirmNewPassword(value)}
              sx={{ bgcolor: "#fff" }}
            />
            <Show when={warning().length > 0}>
              <Alert severity="warning">{warning()}</Alert>
            </Show>
            <Show when={suggestions().length > 0}>
              <Alert severity="info">
                <AlertTitle>Suggestions</AlertTitle>
                <For each={suggestions()}>
                  {(suggestion) => (
                    <Typography variant="body2" mb={1}>
                      - {suggestion}
                    </Typography>
                  )}
                </For>
              </Alert>
            </Show>
          </Show>
          <Show when={!loading()} fallback={<LinearProgress />}>
            <Show when={error().length > 0}>
              <Alert severity="error">{error()}</Alert>
            </Show>
            <Show when={successMsg()}>
              <Alert severity="success">{successMsg()}</Alert>
            </Show>
            <Stack flexDirection="row" alignItems="center" gap={1}>
              <Button variant="contained" type="submit">
                Reset password
              </Button>
              <Link component={A} href="/login">
                Log in
              </Link>
            </Stack>
          </Show>
        </Stack>
      </Stack>
    </Container>
  );
};

export default ResetPassword;
