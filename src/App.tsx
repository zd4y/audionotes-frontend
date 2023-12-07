import { type Component, lazy, onMount, createSignal, Show } from "solid-js";

import { useAuth } from "./auth";
import { Alert } from "@suid/material";
import { Route, Router, Routes } from "@solidjs/router";
import Audios from "./pages/Audios";
import { pingApi } from "./api";
import PageProgress from "./components/PageProgress";
import { useT } from "./I18nProvider";

const Auth = lazy(() => import("./pages/Auth"));
const Audio = lazy(() => import("./pages/Audio"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const App: Component = () => {
  const { loading: authLoading, error: authError } = useAuth();
  const [serverAvailable, setServerAvailable] = createSignal(true);
  const t = useT();

  onMount(async () => {
    const serverAvailable = await pingApi(3);
    setServerAvailable(serverAvailable);
  });

  return (
    <>
      <Show when={!serverAvailable()}>
        <Alert severity="warning">{t("Could not connect to server")}</Alert>
      </Show>
      <Show when={authError()}>
        <Alert severity="error">{authError()}</Alert>
      </Show>
      <Show when={authLoading()}>
        <PageProgress />
      </Show>
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
