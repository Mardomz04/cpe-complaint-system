export default {
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'earflap-art-algebra.ngrok-free.dev'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
}