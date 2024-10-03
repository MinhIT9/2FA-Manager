const webpack = require('webpack');

module.exports = function override(config) {
  // Gộp tất cả các fallback vào chung một đối tượng
  config.resolve.fallback = {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    vm: require.resolve('vm-browserify') // Thêm polyfill cho 'vm'
  };

  // Thêm các plugin cần thiết cho việc sử dụng process và buffer
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser', // Polyfill cho 'process'
      Buffer: ['buffer', 'Buffer'], // Polyfill cho 'Buffer'
    })
  );

  return config;
};
