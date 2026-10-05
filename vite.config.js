import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        allowedHosts: ["compilation-proceeds-charged-feof.trycloudflare.com"],
        proxy: {
            "/api": {
                // target: "https://whatsapp-engine-mz3d.onrender.com", 
                target: "http://localhost:8080",
                // target: "https://protolyte-whatsapp-engine-gcedanfxd7azhte4.eastasia-01.azurewebsites.net",
                // target: "https://sizes-christ-written-usage.trycloudflare.com",
                changeOrigin: true
            }
        }
    }
});
