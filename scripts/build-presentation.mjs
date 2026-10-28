/** Build v4 from v3 with editable text/tables and Vietnamese notes.
 * Optional document tooling, separate from npm app dependencies:
 * RUNTIME_NODE_MODULES=/absolute/runtime/node_modules
 * RUNTIME_PYTHON=/absolute/runtime/python
 * PRESENTATION_SKILL_DIR=/absolute/presentations/skill
 * node scripts/build-presentation.mjs
 * Final output must not exist; preserve each reviewed revision.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const config = JSON.parse(
  await fs.readFile(path.join(root, "docs/presentation.json"), "utf8"),
);
const runtime = process.env.RUNTIME_NODE_MODULES;
const skill = process.env.PRESENTATION_SKILL_DIR;
const python = process.env.RUNTIME_PYTHON;
if (!runtime || !skill || !python)
  throw new Error(
    "Set all three runtime variables listed in the script header.",
  );
const requireRuntime = createRequire(path.join(runtime, "__runtime__.cjs"));
const { FileBlob, PresentationFile } = await import(
  pathToFileURL(requireRuntime.resolve("@oai/artifact-tool")).href
);
const { finalizePresentation } = await import(
  pathToFileURL(path.join(skill, "container_tools/artifact_tool_utils.mjs"))
    .href
);
const staging = path.join(root, ".git/doc-refresh");
await fs.mkdir(staging, { recursive: true });
const source = path.join(root, config.source);
const presentation = await PresentationFile.importPptx(
  await FileBlob.load(source),
);
const inspected = await presentation.inspect({
  kind: "textbox",
  maxChars: 200000,
});
const shapes = inspected.ndjson
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));
for (const [before, after] of Object.entries(config.replacements)) {
  const matches = shapes.filter((shape) => shape.text === before);
  if (matches.length !== 1)
    throw new Error(`Expected one source shape: ${before}`);
  presentation.resolve(matches[0].id).text.replace(before, after);
}
// Keep the source design. Its green cover needs a light page number.
const pageNumber = shapes.find((shape) => shape.text === "01 / 15");
presentation.resolve(pageNumber.id).text.style = {
  fontFamily: "Helvetica Neue",
  fontSize: 18,
  color: "#BFD3C6",
};
// The dated footer now needs two lines; preserve the source font size.
const coverFooter = shapes.find((shape) => shape.text.startsWith("Proposal ·"));
presentation.resolve(coverFooter.id).position.height = 75;
const notes = await fs.readFile(path.join(root, config.notes), "utf8");
const blocks = [
  ...notes.matchAll(/^## Slide (\d+) — (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm),
];
if (blocks.length !== 15)
  throw new Error(`Expected 15 notes, got ${blocks.length}`);
for (const [i, slide] of presentation.slides.items.entries()) {
  slide.speakerNotes.text = `${blocks[i][2]}\n\n${blocks[i][3].trim()}`;
  await fs.writeFile(
    path.join(staging, `slide-${i + 1}.png`),
    new Uint8Array(
      await (
        await presentation.export({ slide, format: "png", scale: 1 })
      ).arrayBuffer(),
    ),
  );
}
const candidatePath = path.join(staging, "candidate.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);
const sourceHash = createHash("sha256")
  .update(await fs.readFile(source))
  .digest("hex");
const result = await finalizePresentation({
  workspaceDir: root,
  candidatePath,
  finalPath: path.join(root, config.output),
  explicitTotalSlideCount: 15,
  requiredNativeTableOwnerSlides: [11, 13],
  pythonExecutable: python,
  integrityValidatorPath: path.join(
    skill,
    "container_tools/inspect_presentation_package_integrity.py",
  ),
  layoutValidatorPath: path.join(
    skill,
    "container_tools/inspect_presentation_layout_geometry.py",
  ),
  layoutArgs: [
    "--expected-slide-size-emu",
    "12192000,6858000",
    "--validate-bullet-geometry",
    "--validate-heading-fit",
    "--require-native-table-slide",
    "11",
    "--require-native-table-slide",
    "13",
  ],
  fontPolicy: {
    basis: "reference",
    families: ["Helvetica Neue"],
    referencePath: source,
    referenceSha256: sourceHash,
  },
  verifyArtifactToolImport: true,
  receiptPath: path.join(staging, "presentation.validation.json"),
});
console.log(JSON.stringify(result));
