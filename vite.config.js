import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use dynamic base so GitHub Actions can set it for Pages
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
});