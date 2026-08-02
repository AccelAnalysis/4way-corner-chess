import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const componentsDirectory = path.join(process.cwd(), 'src', 'components');
const partPattern = /^KaniGame\.part\d+\.jsxpart$/;

const partFiles = (await readdir(componentsDirectory))
  .filter((fileName) => partPattern.test(fileName))
  .sort();

if (partFiles.length === 0) {
  throw new Error('No KaniGame source segments were found.');
}

const segments = await Promise.all(
  partFiles.map((fileName) =>
    readFile(path.join(componentsDirectory, fileName), 'utf8'),
  ),
);

await writeFile(
  path.join(componentsDirectory, 'KaniGame.jsx'),
  segments.join(''),
  'utf8',
);

console.log(`Materialized KaniGame.jsx from ${partFiles.length} source segments.`);
