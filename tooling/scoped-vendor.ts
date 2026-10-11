import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";
import type { Plugin } from "vite";

const scope = ":where(.formio-surface)";
export function scopeVendorCss(css: string) {
  const root = postcss.parse(css);
  root.walkAtRules("charset", (rule) => {
    rule.remove();
  });
  root.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && /keyframes$/i.test(rule.parent.name))
      return;
    rule.selector = selectorParser((selectors) => {
      selectors.each((selector) => {
        const first = selector.first;
        const globalRoot =
          first &&
          ((first.type === "tag" && ["html", "body"].includes(first.value)) ||
            (first.type === "pseudo" && first.value === ":root"));
        if (globalRoot) {
          first.replaceWith(
            selectorParser().astSync(scope).first.first!.clone(),
          );
        } else {
          selector.prepend(selectorParser.combinator({ value: " " }));
          selector.prepend(
            selectorParser().astSync(scope).first.first!.clone(),
          );
        }
      });
    }).processSync(rule.selector);
  });
  return root.toString();
}

export function scopedVendor(): Plugin {
  const require = createRequire(import.meta.url);
  const id = "virtual:formio-vendor.css";
  return {
    name: "scoped-formio-vendor",
    resolveId(source) {
      if (source === id) return `\0${id}`;
    },
    load(source) {
      if (source !== `\0${id}`) return;
      const css = [
        "bootstrap/dist/css/bootstrap.min.css",
        "@formio/js/dist/formio.form.min.css",
      ]
        .map((file) =>
          scopeVendorCss(readFileSync(require.resolve(file), "utf8")),
        )
        .join("\n");
      return `@layer vendor {\n${css}\n}`;
    },
  };
}
