import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const componentsDirectory = path.join(process.cwd(), 'src', 'components');
const componentNames = ['KaniGame', 'OnlineArena'];

for (const componentName of componentNames) {
  const partPattern = new RegExp(`^${componentName}\\.part\\d+\\.jsxpart$`);
  const partFiles = (await readdir(componentsDirectory))
    .filter((fileName) => partPattern.test(fileName))
    .sort();

  if (partFiles.length === 0) {
    throw new Error(`No ${componentName} source segments were found.`);
  }

  const segments = await Promise.all(
    partFiles.map((fileName) => readFile(path.join(componentsDirectory, fileName), 'utf8')),
  );

  await writeFile(
    path.join(componentsDirectory, `${componentName}.jsx`),
    segments.join(''),
    'utf8',
  );

  console.log(`Materialized ${componentName}.jsx from ${partFiles.length} source segments.`);
}
