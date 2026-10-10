import { expect, type Page } from "@playwright/test";
import { openPreview } from "./request-actors";
function blankPdf() {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << >> /Contents 4 0 R >>",
    "<< /Length 0 >>\nstream\n\nendstream",
  ];
  let document = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(document));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const start = Buffer.byteLength(document);
  document += `xref\n0 5\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return Buffer.from(document);
}
export async function inspectOtherPreviews(page: Page) {
  await page.locator('input[type="file"]').setInputFiles([
    {
      name: "pixel.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
        "base64",
      ),
    },
    { name: "sample.pdf", mimeType: "application/pdf", buffer: blankPdf() },
  ]);
  await expect(
    page.getByRole("button", { name: "View file: sample.pdf", exact: true }),
  ).toBeVisible();
  const image = await openPreview(page, "pixel.png");
  await expect(
    image.getByRole("img", { name: "pixel.png", exact: true }),
  ).toHaveJSProperty("naturalWidth", 1);
  await page.keyboard.press("Escape");
  await expect(image).toHaveCount(0);
  const pdf = await openPreview(page, "sample.pdf");
  await expect(
    pdf.locator('iframe[title="File preview: sample.pdf"]'),
  ).toBeVisible();
  await expect(
    pdf.getByRole("link", { name: "Download", exact: true }),
  ).toBeVisible();
  await pdf.getByRole("button", { name: "Close preview", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "fourth.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Exceeds attachment count"),
  });
  await expect(
    page
      .getByRole("region", { name: "Attachments", exact: true })
      .getByRole("alert"),
  ).toContainText("Choose up to 3");
  await expect(
    page.getByRole("button", { name: "View file: fourth.txt", exact: true }),
  ).toHaveCount(0);
}
