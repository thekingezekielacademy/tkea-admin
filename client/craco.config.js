const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Add global React exposure for mini browser compatibility
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          React: 'react',
          ReactDOM: 'react-dom'
        })
      );

      // Expose React globally for mini browsers
      webpackConfig.output.globalObject = 'window';
      
      // Don't externalize React - include it in bundle for mini browser compatibility
      // Mini browsers need React included in the bundle

      return webpackConfig;
    },
  },
};
