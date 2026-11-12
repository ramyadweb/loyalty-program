import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_BACKEND_URL || env.VITE_API_URL || "http://localhost:5000";

  const proxyConfig: Record<string, string | ProxyOptions> = {
    "/api": {
      target: apiTarget,
      changeOrigin: true,
      configure: (proxy) => {
        proxy.on("error", (_err, _req, res) => {
          if (res && "headersSent" in res && !res.headersSent) {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                success: false,
                message: "Unable to connect to the server. Please try again later.",
              })
            );
          }
        });
      },
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: 5173,
      proxy: proxyConfig,
    },
    preview: {
      host: true,
      port: 4173,
      proxy: proxyConfig,
    },
  };
});
