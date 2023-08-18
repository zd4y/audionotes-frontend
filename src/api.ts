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
): Promise<{ error: string; accessToken: string }> {
  const body = JSON.stringify(data);
  const res = await request("/user/authorize", "POST", {}, body);
  const res_data = await res.json();
  return { error: parseError(res.status), accessToken: res_data.access_token };
}

export async function getUser(
  accessToken: string,
): Promise<{ error: string; user: User }> {
  const res = await request("/user", "GET", {
    Authorization: `Bearer ${accessToken}`,
  });
  const user = await res.json();
  return { error: parseError(res.status), user };
}

function parseError(statusCode: number) {
  if (statusCode >= 500) {
    return "Internal server error";
  } else if (statusCode >= 200 && statusCode < 300) {
    return "";
  } else {
    return "Wrong email or password";
  }
}

function request(
  path: string,
  method?: string,
  headers?: { [key: string]: string },
  body?: string,
) {
  return fetch(`${BASE_URL}/api${path}`, {
    method,
    body,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
  });
}
