module.exports = {
    devServer: {
      host: '0.0.0.0',
      port: 8080,
      proxy: {
        '/api': {
          target: 'http://backend:5000',
          changeOrigin: true,
          pathRewrite: { '^/api': '' },
        },
      },
    },
  };