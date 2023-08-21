const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Audio {
  id: number;
  length: number;
  transcription: string;
  created_at: string;
}

export interface User {
  email: string;
}

interface AuthorizeData {
  email: string;
  password: string;
}

export async function pingApi(retries: number): Promise<boolean> {
  if (retries === 0) {
    return false;
  }
  const { res, error } = await request("/");
  if (!res || res.status === 503 || error) {
    await sleep(1000);
    return await pingApi(retries - 1);
  }
  return true;
}

export async function authorize(
  data: AuthorizeData,
): Promise<{ error: string; accessToken: string | null }> {
  const body = JSON.stringify(data);
  const { res, error } = await request("/user/authorize", "POST", {}, body);
  if (res) {
    const res_data = await res.json();
    return {
      error: parseAuthorizeError(res.status),
      accessToken: res_data.access_token || null,
    };
  } else {
    return { error, accessToken: null };
  }
}

export async function getUser(
  accessToken: string,
): Promise<{ error: string; user: User | null }> {
  const { res, error } = await request("/user", "GET", {
    Authorization: `Bearer ${accessToken}`,
  });
  if (res) {
    const user = await res.json();
    return { error: parseError(res.status), user: user || null };
  } else {
    return { error, user: null };
  }
}

export async function getAudios(
  accessToken: string,
): Promise<{ audios: Audio[]; error: string }> {
  const { res, error } = await request("/audios", "GET", {
    Authorization: `Bearer ${accessToken}`,
  });
  if (res) {
    const audios = await res.json();
    return { audios, error: parseError(res.status) };
  } else {
    return { audios: [], error };
  }
}

export async function getAudio(
  accessToken: string,
  audioId: number,
): Promise<{ error: string; audio: Audio | null }> {
  const { res, error } = await request(`/audios/${audioId}`, "GET", {
    Authorization: `Bearer ${accessToken}`,
  });
  if (res) {
    const audio = await res.json();
    return { error: parseError(res.status), audio };
  } else {
    return { error, audio: null };
  }
}

export async function getAudioFile(
  accessToken: string,
  audioId: number,
): Promise<{ error: string; blob: Blob | null }> {
  const { res, error } = await request(`/audios/${audioId}/file`, "GET", {
    Authorization: `Bearer ${accessToken}`,
  });
  if (res) {
    const blob = await res.blob();
    return { error: parseError(res.status), blob };
  } else {
    return { error, blob: null };
  }
}

export async function newAudio(
  accessToken: string,
  blob: Blob,
): Promise<{ error: string }> {
  const { res, error } = await request(
    `/audios`,
    "POST",
    {
      Authorization: `Bearer ${accessToken}`,
    },
    blob,
  );
  if (res) {
    return { error: parseError(res.status) };
  }
  return { error };
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
  const { res, error } = await request("/user/reset-password", "PUT", {}, body);
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
    return {
      reset: false,
      error: parseError(res.status),
      suggestions: [],
      warning: "",
    };
  } else {
    return { reset: false, error, suggestions: [], warning: "" };
  }
}

export async function requestResetPassword(
  email: string,
): Promise<{ sent: boolean; error: string }> {
  const body = JSON.stringify({ email });
  const { res, error } = await request(
    "/user/request-reset-password",
    "PUT",
    {},
    body,
  );
  if (res) {
    if (res.status === 202) {
      return { error: "", sent: true };
    }
    return { error: parseError(res.status), sent: false };
  } else {
    return { error, sent: false };
  }
}

function parseError(statusCode: number) {
  if (statusCode >= 500) {
    return "Internal server error";
  } else if (statusCode >= 200 && statusCode < 300) {
    return "";
  } else if (statusCode === 401) {
    return "Unauthorized";
  } else {
    return `Error ${statusCode}`;
  }
}

function parseAuthorizeError(statusCode: number) {
  if (statusCode >= 500) {
    return "Internal server error";
  } else if (statusCode >= 200 && statusCode < 300) {
    return "";
  } else {
    return "Wrong email or password";
  }
}

async function request(
  path: string,
  method?: string,
  headers?: { [key: string]: string },
  body?: BodyInit,
  isJson?: boolean,
) {
  const headers2 = headers || {};
  if (isJson !== false) {
    headers2["Content-Type"] = "application/json";
  }
  try {
    const res = await fetch(`${BASE_URL}/api${path}`, {
      method,
      body,
      headers: headers2,
    });
    return { res };
  } catch (err) {
    console.error(err);
    return { error: "Internal error" };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
