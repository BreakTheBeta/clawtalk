import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const main = await readFile(new URL('./main.jsx', import.meta.url), 'utf8');
const slides = await readFile(new URL('./slides.js', import.meta.url), 'utf8');

const requiredRefs = [
  'id="root"',
  '/src/main.jsx',
];

const missing = requiredRefs.filter((token) => !html.includes(token));

if (missing.length) {
  console.error('Deck safety check failed. Missing required tokens:');
  for (const token of missing) console.error(`- ${token}`);
  process.exit(1);
}

if (!main.includes('createRoot')) {
  console.error('Deck safety check failed. React root entry point missing createRoot().');
  process.exit(1);
}

if (!slides.includes('export const slides = [')) {
  console.error('Deck safety check failed. Canonical slide data export not found.');
  process.exit(1);
}

console.log('Deck safety check passed.');
