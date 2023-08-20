import { type Component, Switch, Match, lazy, onMount } from "solid-js";

import { useAuth } from "./auth";
import { Alert } from "@suid/material";
import { Route, Router, Routes } from "@solidjs/router";
import Audios from "./pages/Audios";
import { pingApi } from "./api";
import PageProgress from "./components/PageProgress";

const Auth = lazy(() => import("./pages/Auth"));
const Audio = lazy(() => import("./pages/Audio"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const App: Component = () => {
  const { loading, error } = useAuth();

  onMount(async () => {
    await pingApi();
  });

  return (
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
  );
};

export default App;
