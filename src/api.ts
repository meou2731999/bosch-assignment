import type { RequestRecord, SaveInput, User } from '../shared/model';
import type { FormType } from '@formio/react';

export interface Definition { version: 1 | 2; definition: FormType }
export class HttpError extends Error {
  constructor(public code: string, message: string, public fields: Record<string, string> = {}) { super(message); }
}
async function call<T>(user: User, path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init, headers: { 'Content-Type': 'application/json', 'x-demo-user': user.id, ...init?.headers },
      signal: AbortSignal.timeout(15000),
    });
  } catch { throw new HttpError('NETWORK', 'Cannot reach the API. Your input is still here; check the connection and retry.'); }
  let body;
  try { body = await response.json(); }
  catch { throw new HttpError('RESPONSE', 'The API returned an unexpected response. Please retry.'); }
  if (!response.ok) throw new HttpError(body.code, body.message, body.fields);
  return body as T;
}
export const api = {
  list: (user: User) => call<RequestRecord[]>(user, '/requests'),
  get: (user: User, id: string) => call<RequestRecord>(user, `/requests/${encodeURIComponent(id)}`),
  form: (user: User, version?: number) => call<Definition>(user, `/forms/request${version ? `/versions/${version}` : ''}`),
  save: (user: User, id: string, input: SaveInput, fail: boolean) => call<RequestRecord>(user, `/requests/${id}`, {
    method: 'PUT', headers: fail ? { 'x-demo-failure': 'true' } : {}, body: JSON.stringify(input),
  }),
};
