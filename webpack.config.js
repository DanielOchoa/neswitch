const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/orchestrator.js',
  output: {
    path: __dirname + '/build',
    filename: 'orchestrator.bundle.js',
    library: 'Orchestrator',
    libraryTarget: 'commonjs2',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2016'],
            plugins: [
              require('babel-plugin-transform-object-rest-spread'),
            ],
          },
        },
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components|build)/
      }
    ],
  },
};
