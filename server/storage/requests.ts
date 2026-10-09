import { readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import path from "node:path";
import type { RequestRecord } from "../../shared/model";
import { seedRequests } from "../seed";
export function createRequestStore(dataDir: string) {
  const file = path.join(dataDir, "requests.json");
  mkdirSync(dataDir, { recursive: true });
  let records: RequestRecord[];
  try {
    records = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    records = seedRequests();
  }
  function persist(next: RequestRecord[]) {
    writeFileSync(`${file}.tmp`, JSON.stringify(next, null, 2));
    renameSync(`${file}.tmp`, file);
    records = next;
  }
  return {
    all: () => records,
    get: (id: string) => records.find((r) => r.id === id),
    put: (record: RequestRecord) =>
      persist([...records.filter((r) => r.id !== record.id), record]),
  };
}
export type RequestStore = ReturnType<typeof createRequestStore>;
