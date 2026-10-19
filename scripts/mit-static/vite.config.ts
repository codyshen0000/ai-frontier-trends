import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mit = path.resolve(here, "../../vendor/mit");
const engineFile = path.join(here, ".engine-site.json");
const emptySite = JSON.parse(readFileSync(path.resolve(here, "../engine/empty-site.json"), "utf8"));

function engineVirtualPlugin() {
  return {
    name: "ft-engine",
    resolveId(id) {
      if (id === "virtual:ft-engine") return "\0virtual:ft-engine";
    },
    load(id) {
      if (id !== "\0virtual:ft-engine") return;
      const data = existsSync(engineFile) ? JSON.parse(readFileSync(engineFile, "utf8")) : emptySite;
      return `export default ${JSON.stringify(data)};`;
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), engineVirtualPlugin()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "react/jsx-runtime": path.resolve(here, "node_modules/react/jsx-runtime.js"),
      "react/jsx-dev-runtime": path.resolve(here, "node_modules/react/jsx-dev-runtime.js"),
      "react-dom/server": path.resolve(here, "node_modules/react-dom/server.node.js"),
      "react-dom": path.resolve(here, "node_modules/react-dom"),
      react: path.resolve(here, "node_modules/react"),
      "react-router": path.resolve(here, "src/react-router.tsx"),
      "@aihot/site/brand/Logo.tsx": path.resolve(mit, "site/brand/Logo.tsx"),
      "@aihot/site/brand/nameplates": path.resolve(mit, "site/brand/nameplates"),
      "@aihot/site/modules/web": path.resolve(mit, "site/modules/web.ts"),
      "@aihot/site": path.resolve(mit, "site/site.ts"),
      "@aihot/contracts/site": path.resolve(mit, "packages/contracts/src/site.ts"),
      "@aihot/contracts/taxonomy": path.resolve(mit, "packages/contracts/src/taxonomy.ts"),
      "@aihot/contracts/time": path.resolve(mit, "packages/contracts/src/time.ts"),
      "@aihot/contracts/site-config": path.resolve(mit, "packages/contracts/src/site-config.ts"),
      "@aihot/industry/taxonomy": path.resolve(here, "src/industry-taxonomy.ts"),
      "@l2/constants": path.resolve(here, "src/constants.ts"),
    },
  },
  esbuild: { jsx: "automatic", jsxDev: false },
  ssr: {
    external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "react-dom/server"],
  },
});
