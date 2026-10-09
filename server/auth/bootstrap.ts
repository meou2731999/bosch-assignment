import path from "node:path";
import { fileURLToPath } from "node:url";
import { createUserStore } from "./users";
const dataDir =
  process.env.DATA_DIR ??
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.data");
try {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password)
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD to bootstrap the first admin.",
    );
  await createUserStore(dataDir).create(
    {
      email,
      password,
      name: "Administrator",
      department: "Administration",
      role: "requester",
      isAdmin: true,
    },
    true,
  );
  console.log("Administrator created.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Bootstrap failed.");
  process.exitCode = 1;
}
