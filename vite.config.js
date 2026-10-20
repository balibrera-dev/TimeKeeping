import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Writes /ads.txt (which AdSense checks before serving ads) from
 * VITE_ADSENSE_CLIENT, so it never needs to be edited by hand.
 */
function adsTxt(client) {
  const match = /^ca-(pub-\d+)$/.exec(client ?? '');
  const body = match ? `google.com, ${match[1]}, DIRECT, f08c47fec0942fa0\n` : null;
  return {
    name: 'balisoft-ads-txt',
    configureServer(server) {
      server.middlewares.use('/ads.txt', (req, res, next) => {
        if (!body) return next();
        res.setHeader('Content-Type', 'text/plain');
        res.end(body);
      });
    },
    generateBundle() {
      if (body) this.emitFile({ type: 'asset', fileName: 'ads.txt', source: body });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), tailwindcss(), adsTxt(env.VITE_ADSENSE_CLIENT?.trim())],
    // host: true listens on the LAN too, so a phone on the same Wi-Fi can open http://<PC-IP>:5173.
    server: { host: true, port: 5173, open: true },
  };
});
