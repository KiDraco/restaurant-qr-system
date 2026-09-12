const path = require('path');
const { getLoader, loaderByName } = require('@craco/craco');

module.exports = {
  babel: {
    presets: [
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
    plugins: [],
    loaderOptions: (babelLoaderOptions) => {
      babelLoaderOptions.presets = [
        ['@babel/preset-react', { runtime: 'automatic' }],
      ];
      return babelLoaderOptions;
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // Find and modify babel-loader
      const { isFound, match: babelLoaderMatch } = getLoader(
        webpackConfig,
        loaderByName('babel-loader')
      );

      if (isFound) {
        const babelLoader = babelLoaderMatch.loader;
        babelLoader.options = {
          ...babelLoader.options,
          presets: [
            ['@babel/preset-react', { runtime: 'automatic' }],
          ],
          plugins: [],
        };
      }

      return webpackConfig;
    },
  },
};