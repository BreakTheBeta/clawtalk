import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const sourceDir = resolve(repoRoot, 'dist');
const targetDir = '/Users/will/server/blog/howtoopenclaw-dist';

if (!existsSync(sourceDir)) {
  console.error('Build output not found. Run `npm run build` first.');
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });
rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Published ${sourceDir} to ${targetDir}`);
