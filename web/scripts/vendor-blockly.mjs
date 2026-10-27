import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = root + 'node_modules/blockly/';
const target = root + 'public/vendor/';
mkdirSync(target, { recursive: true });
copyFileSync(source + 'LICENSE', target + 'LICENSE');
cpSync(source + 'media', target + 'media', { recursive: true });
const { version } = JSON.parse(readFileSync(source + 'package.json', 'utf8'));
writeFileSync(
  target + 'README.txt',
  `Blockly ${version} media\nJavaScript and plugins are imported through npm and bundled with Vite.\nSource: https://www.npmjs.com/package/blockly/v/${version}\nLicense: Apache-2.0 (see LICENSE).\nRefresh media: npm ci && npm run vendor\n`,
);
