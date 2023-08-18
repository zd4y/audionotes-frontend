import { Show, type Component } from "solid-js";

import Auth from "./pages/Auth";
import { useAuth } from "./auth";
import { Box, CircularProgress } from "@suid/material";

const App: Component = () => {
  const { loading, accessToken } = useAuth();
  return (
    <Show
      when={!loading()}
      fallback={
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
      }
    >
      <Show when={accessToken().length > 0} fallback={<Auth />}>
        Logged in
      </Show>
    </Show>
  );
};

export default App;
