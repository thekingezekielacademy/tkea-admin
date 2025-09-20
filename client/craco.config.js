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
      
      // Add externals to expose React globally
      if (env === 'production') {
        webpackConfig.externals = {
          ...webpackConfig.externals,
          'react': 'React',
          'react-dom': 'ReactDOM'
        };
      }

      return webpackConfig;
    },
  },
};
