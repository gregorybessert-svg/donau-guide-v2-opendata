import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "dv5vjn-5173.csb.app", // deine aktuelle Sandbox-URL
      ".csb.app", // Wildcard für alle CodeSandbox-Subdomains
    ],
  },
});
