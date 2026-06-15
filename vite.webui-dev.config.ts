/**
 * Vite dev server for webui HMR mode (no Electron).
 * Usage: see debug.bat — webhost runs separately for backend/API.
 */
import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import UnoCSS from 'unocss/vite';
import unoConfig from './uno.config';

const rootPkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as { version: string };
const rendererRoot = resolve('packages/desktop/src/renderer');
const WEBHOST_PORT = process.env.AIONUI_PORT ?? '25809';

function iconParkPlugin() {
  return {
    name: 'vite-plugin-icon-park',
    enforce: 'pre' as const,
    transform(source: string, id: string) {
      if (!id.endsWith('.tsx') || id.includes('node_modules')) return null;
      if (!source.includes('@icon-park/react')) return null;
      const transformed = source.replace(
        /import\s+\{\s+([a-zA-Z, ]*)\s+\}\s+from\s+['"]@icon-park\/react['"](;?)/g,
        (str, match) => {
          if (!match) return str;
          const components = (match as string).split(',');
          const importComponent = str.replace(match, components.map((k: string) => `${k} as _${k.trim()}`).join(', '));
          const hoc = `import IconParkHOC from '@renderer/components/IconParkHOC';\n${components.map((k: string) => `const ${k.trim()} = IconParkHOC(_${k.trim()})`).join(';\n')}`;
          return importComponent + ';' + hoc;
        }
      );
      if (transformed !== source) return { code: transformed, map: null };
      return null;
    },
  };
}

export default defineConfig({
  root: rendererRoot,
  base: './',
  publicDir: resolve('public'),
  appType: 'mpa',
  server: {
    port: 5173,
    hmr: { host: 'localhost' },
    proxy: {
      '/api': { target: `http://localhost:${WEBHOST_PORT}`, changeOrigin: true },
      '/ws': { target: `ws://localhost:${WEBHOST_PORT}`, ws: true, changeOrigin: true },
      '/login': { target: `http://localhost:${WEBHOST_PORT}`, changeOrigin: true },
      '/logout': { target: `http://localhost:${WEBHOST_PORT}`, changeOrigin: true },
    },
  },
  resolve: {
    alias: {
      '@': resolve('packages/desktop/src'),
      '@common': resolve('packages/desktop/src/common'),
      '@renderer': rendererRoot,
      '@process': resolve('packages/desktop/src/process'),
      '@worker': resolve('packages/desktop/src/process/worker'),
      streamdown: resolve('node_modules/streamdown/dist/index.js'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
    dedupe: ['react', 'react-dom', 'react-router-dom', '@codemirror/state', '@codemirror/view', '@codemirror/language', '@lezer/highlight'],
  },
  plugins: [UnoCSS(unoConfig), iconParkPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(rootPkg.version),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
    'process.env.AIONUI_MULTI_INSTANCE': JSON.stringify(process.env.AIONUI_MULTI_INSTANCE ?? ''),
  },
});
