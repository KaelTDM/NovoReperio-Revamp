import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://novoreperio.com",
  integrations: [sitemap()],
  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "novoreperio.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
