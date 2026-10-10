import { expect } from "vitest";
import type { BasicField } from "../../shared/fields";
import type { FormRecord } from "../../shared/forms";
import { formsFixture } from "./forms-api";
import { oldFields, draftData, validData } from "../fixtures/draft-upgrades";
export {
  oldFields,
  newFields,
  draftData,
  validData,
} from "../fixtures/draft-upgrades";
export function draftFixture() {
  const f = formsFixture();
  async function publishFields(form: FormRecord, fields: BasicField[]) {
    const response = await f.send(
      `/admin/forms/${form.id}/draft`,
      "admin",
      "PUT",
      { ...form.draft, fields },
    );
    expect(response.status).toBe(200);
    const saved: FormRecord = await response.json();
    const published = await f.send(
      `/admin/forms/${form.id}/publish`,
      "admin",
      "POST",
      { revision: saved.draft.revision },
    );
    expect(published.status).toBe(200);
    return published.json() as Promise<FormRecord>;
  }
  async function create() {
    const response = await f.send("/admin/forms", "admin", "POST", {
      revision: 0,
      name: "Migration",
      description: "Test",
      template: "request-v2",
      fields: oldFields,
    });
    expect(response.status).toBe(201);
    const first: FormRecord = await response.json();
    const published = await f.send(
      `/admin/forms/${first.id}/publish`,
      "admin",
      "POST",
      { revision: first.draft.revision },
    );
    const form: FormRecord = await published.json();
    await f.grant("alex", { [form.id]: ["create"] });
    return form;
  }
  async function draft(form: FormRecord, id: string, data = draftData) {
    const response = await f.send(
      `/requests/${id}`,
      "alex",
      "PUT",
      f.input(form.id, { data }),
    );
    expect(response.status).toBe(201);
    return response.json();
  }
  const preview = (
    id: string,
    revision = 1,
    targetVersion = 2,
    data?: Record<string, unknown>,
  ) =>
    f.send(`/requests/${id}/upgrade/preview`, "alex", "POST", {
      revision,
      targetVersion,
      ...(data ? { data } : {}),
    });
  const apply = (
    id: string,
    token: string,
    revision = 1,
    targetVersion = 2,
    data: Record<string, unknown> = validData,
  ) =>
    f.send(`/requests/${id}/upgrade`, "alex", "POST", {
      revision,
      targetVersion,
      token,
      confirm: true,
      data,
    });
  return { ...f, create, draft, publishFields, preview, apply };
}
