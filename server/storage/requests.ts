import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
  existsSync,
} from "node:fs";
import path from "node:path";
import {
  publicRecord,
  withSnapshots,
  type StoredRequest,
} from "./request-snapshots";
import type { RequestRecord } from "../../shared/model";
import { seedRequests } from "../seed";
export function createRequestStore(dataDir: string) {
  const file = path.join(dataDir, "requests.json");
  mkdirSync(dataDir, { recursive: true });
  let records: StoredRequest[];
  try {
    records = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    records = seedRequests();
  }
  function persist(next: StoredRequest[]) {
    writeFileSync(`${file}.tmp`, JSON.stringify(next, null, 2));
    renameSync(`${file}.tmp`, file);
    records = next;
  }
  if (records.some((record) => !record.formId)) {
    // Persist a copy before the one-time migration; never modify version, payload or audit.
    if (!existsSync(path.join(dataDir, "requests.pre-form-id.json")))
      writeFileSync(
        path.join(dataDir, "requests.pre-form-id.json"),
        JSON.stringify(records, null, 2),
        { flag: "wx" },
      );
    persist(
      records.map((record) => ({
        ...record,
        formId: record.formId ?? "request",
      })),
    );
  }
  return {
    all: () => records.map(publicRecord),
    get: (id: string) => {
      const record = records.find((r) => r.id === id);
      return record ? publicRecord(record) : undefined;
    },
    snapshots: (id: string) =>
      structuredClone(records.find((r) => r.id === id)?.snapshots ?? []),
    put: (record: RequestRecord) =>
      persist([
        ...records.filter((r) => r.id !== record.id),
        withSnapshots(
          record,
          records.find((r) => r.id === record.id),
        ),
      ]),
  };
}
export type RequestStore = ReturnType<typeof createRequestStore>;
