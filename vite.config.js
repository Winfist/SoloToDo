import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Strip crossorigin attributes from built HTML — required for Capacitor WKWebView
// to get real error traces instead of "Script error: line 0"
function removeCrossOriginPlugin() {
  return {
    name: 'remove-crossorigin',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin/g, '');
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), removeCrossOriginPlugin()],
  build: {
    modulePreload: false,
  },
})
