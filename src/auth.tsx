import {
  Accessor,
  ParentComponent,
  createContext,
  createEffect,
  createSignal,
  onMount,
  useContext,
} from "solid-js";
import { getUser } from "./api";
import { useLocation, useNavigate } from "@solidjs/router";

type Data = {
  accessToken: Accessor<string>;
  login: (token: string) => void;
  logout: () => void;
  loading: Accessor<boolean>;
  error: Accessor<string>;
};

const AuthContext = createContext<Data>({
  accessToken: () => "",
  login: (_: string) => {},
  logout: () => {},
  loading: () => true,
  error: () => "",
});

export const AuthProvider: ParentComponent = (props) => {
  const [accessToken, setAccessToken] = createSignal<string>("");
  const [loading, setLoading] = createSignal<boolean>(true);
  const [error, setError] = createSignal<string>("");

  onMount(async () => {
    const savedToken = localStorage.getItem("access_token");
    if (savedToken) {
      setAccessToken(savedToken);
      setError("");
      setLoading(false);

      const { error } = await getUser(savedToken);
      if (error) {
        setAccessToken("");
        setError(error);
        if (error === "Unauthorized") {
          localStorage.removeItem("access_token");
        }
      }
    } else {
      setAccessToken("");
      setError("");
      setLoading(false);
    }
  });

  const auth = {
    accessToken,
    loading,
    error,
    login(token: string) {
      setAccessToken(token);
      localStorage.setItem("access_token", token);
    },
    logout() {
      localStorage.removeItem("access_token");
      setAccessToken("");
    },
  };
  return (
    <AuthContext.Provider value={auth}>{props.children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const useAuthenticated = () => {
  const { accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  createEffect(() => {
    const next = location.pathname + location.search;
    if (!accessToken()) {
      navigate("/login", { replace: true, state: { next } });
    }
  });

  return accessToken;
};
