const webpack = require('webpack');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const env = process.env;

const webpackConfig = {
  entry: {
    main: './src/index.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['@babel/preset-env'],
          plugins: [
            [
              '@babel/plugin-transform-react-jsx',
              {
                pragma: 'ToyReact.createElement',
              },
            ],
          ],
        },
      },
    ],
  },
  mode: 'development',
  optimization: {
    minimize: false,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      title: 'Index',
    }),
  ],
};

module.exports = webpackConfig;
