import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://goalflash.pages.dev",
  output: "static",
  integrations: [sitemap()],
  build: { format: "directory" },
});
