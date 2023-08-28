const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CACHE_NAME = "audionotes";

export interface Audio {
  id: number;
  length: number;
  transcription: string;
  created_at: string;
  tags: Tag[];
}

export interface User {
  email: string;
}

export interface Tag {
  name: string;
  color: string | null;
}

interface AuthorizeData {
  email: string;
  password: string;
}

export async function pingApi(retries: number): Promise<boolean> {
  if (retries === 0) {
    return false;
  }
  const { res } = await request("/ping", { allowCache: true });
  if (!res?.ok) {
    await sleep(1000);
    return await pingApi(retries - 1);
  }
  return true;
}

export async function authorize(
  data: AuthorizeData,
): Promise<{ error: string; accessToken: string | null }> {
  const body = JSON.stringify(data);
  const { res, error } = await request("/user/authorize", {
    method: "POST",
    body,
    allowCache: true,
  });
  if (res) {
    const res_data = await res.json();
    return {
      error: res.status === 401 ? "Wrong email or password" : error,
      accessToken: res_data.access_token || null,
    };
  } else {
    return { error, accessToken: null };
  }
}

export async function getUser(
  accessToken: string,
): Promise<{ error: string; user: User | null }> {
  const { res, error } = await request("/user", {
    allowCache: true,
    accessToken,
  });
  let user = null;
  if (res?.ok) {
    user = await res.json();
  }
  return { error, user };
}

export async function getAudios(
  getCached: boolean,
  accessToken: string,
): Promise<{ audios: Audio[]; error: string }> {
  const { res, error } = await request("/audios", {
    accessToken,
    allowCache: true,
    getCached,
  });
  let audios = [];
  if (res?.ok) {
    audios = await res.json();
  }
  return { audios, error };
}

export async function getAudio(
  accessToken: string,
  audioId: number,
): Promise<{ error: string; audio: Audio | null }> {
  const { res, error } = await request(`/audios/${audioId}`, {
    accessToken,
    allowCache: true,
  });
  let audio = null;
  if (res?.ok) {
    audio = await res.json();
  }
  return { error, audio };
}

export async function getAudioFile(
  accessToken: string,
  audioId: number,
): Promise<{ error: string; blob: Blob | null }> {
  const { res, error } = await request(`/audios/${audioId}/file`, {
    accessToken,
    allowCache: true,
  });
  let blob = null;
  if (res?.ok) {
    blob = await res.blob();
  }
  return { error, blob };
}

export async function deleteAudio(
  accessToken: string,
  audioId: number,
): Promise<{ error: string; info: string }> {
  const { error } = await request(`/audios/${audioId}`, {
    method: "DELETE",
    accessToken,
    allowCache: false,
  });
  if (error === "Internal error") {
    return {
      error: "",
      info: "The audio will be deleted once the connection is restored",
    };
  }
  return { error, info: "" };
}

export async function newAudio(
  accessToken: string,
  blob: Blob,
): Promise<{ error: string; info: string }> {
  const { error } = await request("/audios", {
    method: "POST",
    accessToken,
    allowCache: false,
    body: blob,
    isJson: false,
  });
  if (error === "Internal error") {
    return {
      error: "",
      info: "The audio will be uploaded once the connection is restored",
    };
  }
  return { error, info: "" };
}

interface ResetPasswordData {
  user_id: number;
  token: string;
  new_password: string;
}

export async function resetPassword(data: ResetPasswordData): Promise<{
  reset: boolean;
  error: string;
  suggestions: string[];
  warning: string;
}> {
  const body = JSON.stringify(data);
  const { res, error } = await request("/user/reset-password", {
    method: "PUT",
    body,
    allowCache: false,
  });
  if (res) {
    if (res.status === 204) {
      return { reset: true, error: "", suggestions: [], warning: "" };
    } else if (res.status === 400) {
      const resData = await res.json();
      return {
        reset: false,
        error: resData.error,
        suggestions: resData.suggestions,
        warning: resData.warning,
      };
    } else if (res.status === 404) {
      return {
        reset: false,
        error: "Token doesn't exist or is expired",
        warning: "",
        suggestions: [],
      };
    }
  }

  return { reset: false, error, suggestions: [], warning: "" };
}

export async function requestResetPassword(
  email: string,
): Promise<{ sent: boolean; error: string }> {
  const body = JSON.stringify({ email });
  const { res, error } = await request("/user/request-reset-password", {
    method: "PUT",
    body,
    allowCache: false,
  });
  if (res?.status === 202) {
    return { error: "", sent: true };
  } else {
    return { error, sent: false };
  }
}

const request = async (
  path: string,
  {
    method = "GET",
    accessToken,
    body,
    isJson = true,
    allowCache,
    getCached = false,
  }: {
    method?: string;
    accessToken?: string;
    body?: BodyInit;
    isJson?: boolean;
    allowCache: boolean;
    getCached?: boolean;
  },
): Promise<{ res: Response | null; error: string }> => {
  const headers: HeadersInit = {};
  if (body && isJson !== false) {
    headers["Content-Type"] = "application/json";
  }
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const cacheStorage = await caches.open(CACHE_NAME);
  const url = `${BASE_URL}/api${path}`;

  if (getCached) {
    const res = (await cacheStorage.match(url)) || null;
    const error = res ? getError(res) : "";
    return { res, error };
  }

  try {
    const res = await fetch(url, {
      method,
      body,
      headers,
    });
    if (allowCache !== false && res.ok) {
      await cacheStorage.put(url, res.clone());
    }
    return { res, error: getError(res) };
  } catch (err) {
    let cachedResponse = undefined;
    if (allowCache !== false) {
      cachedResponse = await cacheStorage.match(url);
    }

    if (cachedResponse !== undefined) {
      return { res: cachedResponse, error: getError(cachedResponse) };
    }

    console.error(err);
    return { res: null, error: "Internal error" };
  }
};

function getError(response: Response) {
  if (response.ok) {
    return "";
  } else if (response.status >= 500) {
    return "Internal server error";
  } else if (response.status === 401) {
    return "Unauthorized";
  } else {
    return `Error ${response.status}`;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
