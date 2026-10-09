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
export async function call<T>(
  user: User,
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-demo-user": user.id,
        ...init?.headers,
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new HttpError(
      "NETWORK",
      "Cannot reach the API. Your input is still here; check the connection and retry.",
    );
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new HttpError(
      "RESPONSE",
      "The API returned an unexpected response. Please retry.",
    );
  }
  if (!response.ok) throw new HttpError(body.code, body.message, body.fields);
  return body as T;
}
