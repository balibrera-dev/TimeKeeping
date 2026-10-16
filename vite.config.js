import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// host: true listens on the local network too, so a phone on the same Wi-Fi
// can open the "Network" URL Vite prints (http://<this PC's IP>:5173).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: true, port: 5173, open: true },
  preview: { host: true, port: 4173 },
});
