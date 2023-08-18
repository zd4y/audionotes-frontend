const BASE_URL = "http://127.0.0.1:8000";

interface User {
  email: string;
}

interface AuthorizeData {
  email: string;
  password: string;
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
      accessToken: res_data.access_token,
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
    return { error: parseError(res.status), user };
  } else {
    return { error, user: null };
  }
}

function parseError(statusCode: number) {
  if (statusCode >= 500) {
    return "Internal server error"
  } else if (statusCode >= 200 && statusCode < 300) {
    return ""
  } else {
    return `Error ${statusCode}`
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
