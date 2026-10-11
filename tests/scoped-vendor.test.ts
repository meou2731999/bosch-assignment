import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import postcss from "postcss";
import { scopeVendorCss } from "../tooling/scoped-vendor";

describe("vendor CSS isolation", () => {
  it("scopes selector lists, root variables and nested media without changing keyframes", () => {
    const css = scopeVendorCss(
      '@charset "UTF-8"; :root,body {--bs-test: 1} .btn,[title="a,b"] {padding: 1rem} @media(min-width:1px){.container {width:100%}} @keyframes spin {from {opacity:0} to {opacity:1}}',
    );
    expect(css).not.toContain("@charset");
    expect(css).toContain(":where(.formio-surface) .btn");
    expect(css).toContain(':where(.formio-surface) [title="a,b"]');
    expect(css).toContain(":where(.formio-surface) .container");
    expect(css).toContain("from {opacity:0}");
    expect(css).not.toContain(":where(.formio-surface) from");
    expect(css).not.toContain("body {");
  });
  it.each([
    "bootstrap/dist/css/bootstrap.min.css",
    "@formio/js/dist/formio.form.min.css",
  ])("isolates every selector from %s", (file) => {
    const require = createRequire(import.meta.url);
    const css = scopeVendorCss(readFileSync(require.resolve(file), "utf8"));
    postcss.parse(css).walkRules((rule) => {
      if (
        rule.parent?.type === "atrule" &&
        /keyframes$/i.test(rule.parent.name)
      )
        return;
      for (const selector of rule.selectors)
        expect(selector.trim()).toMatch(/^:where\(\.formio-surface\)/);
    });
  });
});
