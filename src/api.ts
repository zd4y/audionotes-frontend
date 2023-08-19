const BASE_URL = "http://127.0.0.1:8000";

interface User {
  email: string;
}

interface AuthorizeData {
  email: string;
  password: string;
}

export async function pingApi(): Promise<void> {
  const { res, error } = await request("/");
  if (!res || res.status === 503 || error) {
    await sleep(1000);
    return await pingApi()
  }
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
  body?: string,
) {
  try {
    const res = await fetch(`${BASE_URL}/api${path}`, {
      method,
      body,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
    });
    return { res };
  } catch (err) {
    console.error(err);
    return { error: "Internal error" };
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
