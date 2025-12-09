import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ fastRefresh: true })],
  server: {
    // On some Windows setups the file watcher can miss changes from certain editors.
    // Enabling polling here makes dev changes more reliably detected and HMR applied immediately.
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      // keep overlay enabled so runtime errors are visible; HMR will apply updates when files change
      overlay: true
    }
  }
})
