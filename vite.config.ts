import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Librerías pesadas en chunks propios (se cargan solo cuando la ruta las necesita).
        manualChunks(id: string) {
          if (id.includes('node_modules/three') || id.includes('@react-three')) return 'three';
          if (id.includes('maplibre-gl')) return 'maplibre';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('node_modules/react') || id.includes('react-router') || id.includes('zustand')) return 'react';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
  test: { include: ['src/tests/**/*.test.{ts,tsx}'] },
});
