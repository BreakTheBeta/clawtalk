import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const sourceDir = resolve(repoRoot, 'dist');
const targetDir = '/Users/will/server/blog/howtoopenclaw-dist';

if (!existsSync(sourceDir)) {
  console.error('Build output not found. Run `npm run build` first.');
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });
for (const entry of readdirSync(targetDir)) {
  rmSync(resolve(targetDir, entry), { recursive: true, force: true });
}
cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Published ${sourceDir} to ${targetDir}`);
