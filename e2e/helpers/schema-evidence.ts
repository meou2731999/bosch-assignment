import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";
export function bundleManifest() {
  return [
    "index.html",
    ...readdirSync("dist/assets")
      .sort()
      .map((file) => `assets/${file}`),
  ].map((file) => {
    const bytes = readFileSync(path.join("dist", file));
    return {
      file,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  });
}
export async function assertServedBundle(
  page: Page,
  manifest: ReturnType<typeof bundleManifest>,
) {
  for (const artifact of manifest) {
    const response = await page.request.get(`/${artifact.file}`);
    expect(response.status()).toBe(200);
    expect(
      createHash("sha256")
        .update(await response.body())
        .digest("hex"),
    ).toBe(artifact.sha256);
  }
}
