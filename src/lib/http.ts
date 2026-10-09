import type { User } from "../../shared/model";
export class HttpError extends Error {
  constructor(
    public code: string,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
export async function request(
  user: User,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let response: Response;
  const timeout = AbortSignal.timeout(15000);
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-demo-user": user.id,
        ...init?.headers,
      },
      signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
    });
  } catch {
    throw new HttpError(
      "NETWORK",
      "Cannot reach the API. Your input is still here; check the connection and retry.",
    );
  }
  if (!response.ok) {
    let body;
    try {
      body = await response.json();
    } catch {
      throw new HttpError(
        "RESPONSE",
        "The API returned an unexpected response. Please retry.",
      );
    }
    throw new HttpError(body.code, body.message, body.fields);
  }
  return response;
}
export async function call<T>(
  user: User,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await request(user, path, init);
  try {
    return (await response.json()) as T;
  } catch {
    throw new HttpError(
      "RESPONSE",
      "The API returned an unexpected response. Please retry.",
    );
  }
}
