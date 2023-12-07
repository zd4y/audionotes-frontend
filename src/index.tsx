/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { AuthProvider } from "./auth";
import { I18nProvider } from "./I18nProvider";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

render(
  () => (
    <I18nProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </I18nProvider>
  ),
  root!,
);
