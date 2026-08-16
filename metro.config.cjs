const path = require('path');
const { getDefaultConfig, mergeConfig } = require('./react-native-app/node_modules/@react-native/metro-config/dist/index.js');

const appDir = path.resolve(__dirname, 'react-native-app');
const defaultConfig = getDefaultConfig(appDir);

const config = {
  projectRoot: appDir,
  watchFolders: [appDir],
};

module.exports = mergeConfig(defaultConfig, config);
