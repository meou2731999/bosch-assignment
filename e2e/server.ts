import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../server/app";
import { createUserStore } from "../server/auth/users";
const dataDir = mkdtempSync(path.join(tmpdir(), "request-e2e-"));
await createUserStore(dataDir).create(
  {
    email: "admin@example.test",
    password: "e2e-admin-password",
    name: "E2E Admin",
    department: "IT",
    role: "requester",
    isAdmin: true,
  },
  true,
);
const server = createApp({ dataDir, production: true }).listen(
  3107,
  "127.0.0.1",
);
function close() {
  server.close(() => {
    rmSync(dataDir, { recursive: true, force: true });
    process.exit(0);
  });
}
process.on("SIGTERM", close);
process.on("SIGINT", close);
