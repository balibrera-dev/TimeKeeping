import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // host: true listens on the LAN too, so a phone on the same Wi-Fi can open http://<PC-IP>:5173.
  server: { host: true, port: 5173, open: true },
});
