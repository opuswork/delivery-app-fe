import { clearToken, getToken } from "@/lib/token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4100";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Attach the Bearer token (default true). */
  auth?: boolean;
  signal?: AbortSignal;
}

async function extractMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join("\n");
    if (data.message) return data.message;
  } catch {
    // fall through to the generic message
  }
  return `요청에 실패했습니다. (${res.status})`;
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, auth = true, signal }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(0, "서버에 연결할 수 없습니다.");
  }

  // An authenticated request rejected with 401 means the session is over;
  // clearing the token makes AuthGuard redirect to /login.
  if (res.status === 401 && auth) clearToken();
  if (!res.ok) throw new ApiError(res.status, await extractMessage(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
