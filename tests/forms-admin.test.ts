import { describe, expect, it } from "vitest";
import { formsFixture } from "./helpers/forms-api";
const fixture = formsFixture();
const { send, createForm } = fixture;
describe("form catalog, publication and server authorization", () => {
  it("keeps unpublished drafts private, restricts admin endpoints and validates grants", async () => {
    const draft = await createForm("Unpublished form", false);
    expect((await send("/admin/forms", "alex")).status).toBe(403);
    expect((await send(`/forms/${draft.id}`, "alex")).status).toBe(404);
    const catalog = await (await send("/forms")).json();
    expect(catalog.some((form: { id: string }) => form.id === draft.id)).toBe(
      false,
    );
    const users = await (await send("/admin/users")).json();
    const alex = users.find((user: { id: string }) => user.id === "alex");
    expect(
      (
        await send("/admin/users/alex/form-permissions", "admin", "PUT", {
          revision: alex.permissionRevision,
          formPermissions: { unknown: ["create"] },
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await send("/admin/users/alex/form-permissions", "admin", "PUT", {
          revision: alex.permissionRevision,
          formPermissions: { request: ["create", "create"] },
        })
      ).status,
    ).toBe(422);
    expect(
      (
        await send("/admin/users/alex/form-permissions", "admin", "PUT", {
          revision: alex.permissionRevision,
          formPermissions: { request: ["publish"] },
        })
      ).status,
    ).toBe(422);
    expect(
      (
        await send("/admin/users/alex/form-permissions", "alex", "PUT", {
          revision: 0,
          formPermissions: {},
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await send(`/admin/forms/${draft.id}/draft`, "admin", "PUT", {
          revision: 1,
          name: "Unsafe",
          description: "",
          template: "request-v2",
          definition: { customConditional: "alert(1)" },
        })
      ).status,
    ).toBe(422);
  });
});
