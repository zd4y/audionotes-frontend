import { type Component, Switch, Match } from "solid-js";

import Auth from "./pages/Auth";
import { useAuth } from "./auth";
import { Alert, Box, CircularProgress } from "@suid/material";

const App: Component = () => {
  const { loading, error, accessToken } = useAuth();
  return (
    <Switch fallback={<Auth />}>
      <Match when={error().length > 0}>
        <Alert severity="error">{error()}</Alert>
      </Match>
      <Match when={loading()}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Match>
      <Match when={accessToken().length > 0}>
        Logged In
      </Match>
    </Switch>
  )
};

export default App;
