import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const pluginPath = path.resolve(__dirname, 'react-native-app/node_modules/@react-native/community-cli-plugin/dist/index.js');
const plugin = require(pluginPath);

const androidPlatformPath = path.resolve(__dirname, 'react-native-app/node_modules/@react-native-community/cli-platform-android');
const androidPlatform = require(androidPlatformPath);

const android = {
  linkConfig: androidPlatform.linkConfig,
  projectConfig: androidPlatform.projectConfig,
  dependencyConfig: androidPlatform.dependencyConfig,
};

export const root = path.resolve(__dirname, 'react-native-app');
export const reactNativePath = path.resolve(__dirname, 'react-native-app/node_modules/react-native');
export const platforms = {
  android,
};
export const commands = [
  plugin.bundleCommand,
  plugin.startCommand,
];

const config = {
  root,
  reactNativePath,
  platforms,
  commands,
};

export default config;
