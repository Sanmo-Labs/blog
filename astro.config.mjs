import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const site = process.env.SITE_URL ?? "https://blog.rumptycloud.com";

export default defineConfig({
  site,
  integrations: [sitemap()],
});
