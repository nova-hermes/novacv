import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000
  },
  optimizeDeps: {
    exclude: ["pdfjs-dist"]
  },
  ssr: {
    noExternal: ["pdfjs-dist"],
    // Ensure process.env vars are read at runtime, not inlined at build time
    external: [],
  },
  define: {
    // Let these be resolved at runtime (Node.js) instead of inlined by Vite
    "process.env.CLERK_SECRET_KEY": "process.env.CLERK_SECRET_KEY",
    "process.env.STRIPE_SECRET_KEY": "process.env.STRIPE_SECRET_KEY",
    "process.env.STRIPE_WEBHOOK_SECRET": "process.env.STRIPE_WEBHOOK_SECRET",
    "process.env.APP_URL": "process.env.APP_URL",
    "process.env.SUPABASE_SERVICE_ROLE_KEY": "process.env.SUPABASE_SERVICE_ROLE_KEY",
    "process.env.VITE_SUPABASE_URL": "process.env.VITE_SUPABASE_URL",
    "process.env.VITE_SUPABASE_ANON_KEY": "process.env.VITE_SUPABASE_ANON_KEY",
    "process.env.VITE_CLERK_PUBLISHABLE_KEY": "process.env.VITE_CLERK_PUBLISHABLE_KEY",
    "process.env.STRIPE_PRICE_PRO_MONTHLY": "process.env.STRIPE_PRICE_PRO_MONTHLY",
    "process.env.STRIPE_PRICE_PRO_YEARLY": "process.env.STRIPE_PRICE_PRO_YEARLY",
    "process.env.STRIPE_PRICE_LIFETIME": "process.env.STRIPE_PRICE_LIFETIME",
  },
  plugins: [
    tsconfigPaths(),
    tanstackStart({
      srcDirectory: "src",
      router: {
        routesDirectory: "routes"
      }
    }),
    viteReact()
  ]
});
