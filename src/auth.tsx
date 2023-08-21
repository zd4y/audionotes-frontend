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
    if (savedToken !== null && savedToken.length > 0) {
      const { error } = await getUser(savedToken);
      if (error.length == 0) {
        setAccessToken(savedToken);
        setError("");
      } else {
        setAccessToken("");
        setError(error);
        if (error === "Unauthorized") {
          localStorage.removeItem("access_token");
        }
      }
      setLoading(false);
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
      localStorage.setItem("access_token", token);
      setAccessToken(token);
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
