import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Prioritize GEMINI_API_KEY, then API_KEY
  const apiKey = env.GEMINI_API_KEY || env.API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Define a global constant that is replaced at build time.
      // This avoids reliance on 'process' which does not exist in the browser.
      '__APP_GEMINI_KEY__': JSON.stringify(apiKey)
    }
  };
});