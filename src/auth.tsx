import {
  Accessor,
  ParentComponent,
  createContext,
  createSignal,
  onMount,
  useContext,
} from "solid-js";
import { getUser } from "./api";

type Data = {
  accessToken: Accessor<string>;
  login: (token: string) => void;
  logout: () => void;
  loading: Accessor<boolean>;
};

const AuthContext = createContext<Data>({
  accessToken: () => "",
  login: (_: string) => {},
  logout: () => {},
  loading: () => true,
});

export const AuthProvider: ParentComponent = (props) => {
  const [accessToken, setAccessToken] = createSignal<string>("");
  const [loading, setLoading] = createSignal<boolean>(true);

  onMount(async () => {
    const savedToken = sessionStorage.getItem("access_token");
    if (savedToken !== null && savedToken.length > 0) {
      const { error } = await getUser(savedToken);
      if (error.length == 0) {
        setAccessToken(savedToken);
      } else {
        setAccessToken("");
        sessionStorage.removeItem("access_token");
      }
      setLoading(false);
    }
  });

  const auth = {
    accessToken,
    loading,
    login(token: string) {
      sessionStorage.setItem("access_token", token);
      setAccessToken(token);
    },
    logout() {
      sessionStorage.removeItem("access_token");
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
