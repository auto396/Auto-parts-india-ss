const path = require('path');

const plugin = require(path.resolve(__dirname, 'react-native-app/node_modules/@react-native/community-cli-plugin/dist/index.js'));

module.exports = {
  root: path.resolve(__dirname, 'react-native-app'),
  reactNativePath: path.resolve(__dirname, 'react-native-app/node_modules/react-native'),
  commands: [
    plugin.bundleCommand,
    plugin.startCommand,
  ],
};
