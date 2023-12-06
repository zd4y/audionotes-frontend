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
  const { loading: authLoading, error: authError } = useAuth();
  const [serverAvailable, setServerAvailable] = createSignal(true);

  onMount(async () => {
    const serverAvailable = await pingApi(3);
    setServerAvailable(serverAvailable);
  });

  return (
    <>
      <Show when={!serverAvailable()}>
        <Alert severity="warning">Could not connect to server</Alert>
      </Show>
      <Match when={authError()}>
        <Alert severity="error">{authError()}</Alert>
      </Match>
      <Match when={authLoading()}>
        <PageProgress />
      </Match>
      <Router>
        <Routes>
          <Route path="/" component={Audios} />
          <Route path="/:id" component={Audio} />
          <Route path="/login" component={Auth} />
          <Route path="/reset-password" component={ResetPassword} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
