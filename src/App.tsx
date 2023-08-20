import {
  type Component,
  Switch,
  Match,
  lazy,
  onMount,
  createSignal,
  Show,
} from "solid-js";

import { useAuth } from "./auth";
import { Alert, Container } from "@suid/material";
import { Route, Router, Routes } from "@solidjs/router";
import Audios from "./pages/Audios";
import { pingApi } from "./api";
import PageProgress from "./components/PageProgress";

const Auth = lazy(() => import("./pages/Auth"));
const Audio = lazy(() => import("./pages/Audio"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const App: Component = () => {
  const { loading, error } = useAuth();
  const [serverAvailable, setServerAvailable] = createSignal(true);

  onMount(async () => {
    const serverAvailable = await pingApi(3);
    setServerAvailable(serverAvailable);
  });

  return (
    <Show
      when={serverAvailable()}
      fallback={
        <Container sx={{ mt: 15 }}>
          <Alert severity="error">Server unavailable</Alert>
        </Container>
      }
    >
      <Switch
        fallback={
          <Router>
            <Routes>
              <Route path="/" component={Audios} />
              <Route path="/:id" component={Audio} />
              <Route path="/login" component={Auth} />
              <Route path="/reset-password" component={ResetPassword} />
            </Routes>
          </Router>
        }
      >
        <Match when={error().length > 0}>
          <Alert severity="error">{error()}</Alert>
        </Match>
        <Match when={loading()}>
          <PageProgress />
        </Match>
      </Switch>
    </Show>
  );
};

export default App;
