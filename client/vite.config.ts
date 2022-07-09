import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { execSync } from 'child_process';

// TODO WHY ?
// const glsl = (glslModule as any).default as any;

let VERSION = `timestamp_${Date.now()}`;
try {
  VERSION = execSync('git rev-parse --short HEAD', {
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .toString()
    .trim();
} catch (e) {
  console.error(e);
}
console.log(`VERSION: ${VERSION}`);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    __APP_VERSION__: JSON.stringify(VERSION),
  },
});
