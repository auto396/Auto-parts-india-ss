const path = require('path');

const plugin = require('./node_modules/@react-native/community-cli-plugin/dist/index.js');

module.exports = {
  root: path.resolve(__dirname),
  reactNativePath: path.resolve(__dirname, 'node_modules/react-native'),
  commands: [
    plugin.bundleCommand,
    plugin.startCommand,
  ],
  assets: ['./src/assets/fonts/'],
};
