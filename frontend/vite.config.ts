import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // Add this import

export default defineConfig({
  plugins: [
    tailwindcss(), // Add the plugin here
    react()
  ],
  resolve: {
    alias: {
      'react': 'react',
      'react-dom': 'react-dom',
    },
    dedupe: ['react', 'react-dom'],
  },
});