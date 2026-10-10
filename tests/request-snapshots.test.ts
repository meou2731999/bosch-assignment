import { afterEach, describe, expect, it } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequestStore } from "../server/storage/requests";
import { saveRequest, alex, input, now } from "./helpers/request-service";
const dirs: string[] = [];
function fixture() {
  const dir = mkdtempSync(path.join(tmpdir(), "snapshots-"));
  dirs.push(dir);
  return { dir, store: createRequestStore(dir) };
}
afterEach(() => {
  for (const dir of dirs.splice(0))
    rmSync(dir, { recursive: true, force: true });
});
describe("atomic request snapshots", () => {
  it("captures each saved draft and retains immutable detached snapshots across save/submit/restart", () => {
    const { dir, store } = fixture();
    const first = saveRequest(
      alex,
      undefined,
      input({ action: "draft" }),
      "history",
      now,
    );
    store.put(first);
    const changed = saveRequest(
      alex,
      first,
      input({
        revision: 1,
        action: "draft",
        data: { ...first.data, requestTitle: "Changed title" },
      }),
      first.id,
      now,
    );
    store.put(changed);
    const snapshots = store.snapshots(first.id);
    expect(snapshots.map((item) => item.revision)).toEqual([1, 2]);
    snapshots[0].data.requestTitle = "Mutated";
    expect(store.snapshots(first.id)[0].data).toEqual(first.data);
    expect(store.get(first.id)).not.toHaveProperty("snapshots");
    const submitted = saveRequest(
      alex,
      changed,
      input({ revision: 2, data: changed.data }),
      first.id,
      now,
    );
    store.put(submitted);
    expect(createRequestStore(dir).snapshots(first.id)).toHaveLength(2);
    expect(createRequestStore(dir).get(first.id)?.status).toBe("submitted");
  });
  it("captures a legacy unsnapshotted draft before its first mutation and leaves old records untouched on load", () => {
    const { dir } = fixture();
    const first = saveRequest(
      alex,
      undefined,
      input({ action: "draft" }),
      "legacy",
      now,
    );
    writeFileSync(path.join(dir, "requests.json"), JSON.stringify([first]));
    const legacy = createRequestStore(dir);
    expect(legacy.snapshots(first.id)).toEqual([]);
    legacy.put({
      ...first,
      revision: first.revision + 1,
      data: { ...first.data, requestTitle: "Legacy edited" },
    });
    const snapshots = createRequestStore(dir).snapshots(first.id);
    expect(snapshots[0].data).toEqual(first.data);
    expect(snapshots.map((item) => item.revision)).toEqual([
      first.revision,
      first.revision + 1,
    ]);
  });
  it("keeps both persisted record and snapshot history unchanged when atomic write fails", () => {
    const { dir, store } = fixture();
    const first = saveRequest(
      alex,
      undefined,
      input({ action: "draft" }),
      "failure",
      now,
    );
    store.put(first);
    const bytes = readFileSync(path.join(dir, "requests.json"), "utf8");
    mkdirSync(path.join(dir, "requests.json.tmp"));
    expect(() =>
      store.put({ ...first, revision: 2, data: { requestTitle: "Fail" } }),
    ).toThrow();
    expect(store.get(first.id)).toEqual(first);
    expect(store.snapshots(first.id)).toHaveLength(1);
    expect(readFileSync(path.join(dir, "requests.json"), "utf8")).toBe(bytes);
  });
});
