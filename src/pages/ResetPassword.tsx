import {
  Alert,
  AlertTitle,
  Button,
  Container,
  LinearProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from "@suid/material";
import { For, Show, createSignal } from "solid-js";
import { requestResetPassword, resetPassword } from "../api";
import { A, useSearchParams } from "@solidjs/router";
import { useT } from "../I18nProvider";

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
  const t = useT();

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setError("");
    setWarning("");
    setSuggestions([]);
    if (searchParams.token && searchParams.user_id) {
      if (newPassword() !== confirmNewPassword()) {
        setError(t("Passwords don't match."));
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
        setSuccessMsg(t("Password reset, you may now log in."));
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
          t(
            "If an account with that email exists, an email will be sent with a reset link.",
          ),
        );
      } else {
        setError(error);
      }
      setLoading(false);
    }
  };

  return (
    <Container sx={{ display: "flex", justifyContent: "center", mt: 20 }}>
      <Stack spacing={2} width="30ch">
        <Typography variant="h4">AudioNotes</Typography>
        <Stack component="form" spacing={2} onSubmit={onSubmit}>
          <Show
            when={searchParams.token}
            fallback={
              <TextField
                required
                type="email"
                name="email"
                label={t("email")}
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
              label={t("new password")}
              value={newPassword()}
              onChange={(_, value) => setNewPassword(value)}
              sx={{ bgcolor: "#fff" }}
            />
            <TextField
              type="password"
              name="confirm_new_password"
              label={t("confirm new password")}
              value={confirmNewPassword()}
              onChange={(_, value) => setConfirmNewPassword(value)}
              sx={{ bgcolor: "#fff" }}
            />
            <Show when={warning()}>
              <Alert severity="warning">{warning()}</Alert>
            </Show>
            <Show when={suggestions().length > 0}>
              <Alert severity="info">
                <AlertTitle>{t("Suggestions")}</AlertTitle>
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
            <Show when={error()}>
              <Alert severity="error">{error()}</Alert>
            </Show>
            <Show when={successMsg()}>
              <Alert severity="success">{successMsg()}</Alert>
            </Show>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button variant="contained" type="submit">
                {t("Reset password")}
              </Button>
              <Link component={A} href="/login">
                {t("Log in")}
              </Link>
            </Stack>
          </Show>
        </Stack>
      </Stack>
    </Container>
  );
};

export default ResetPassword;
