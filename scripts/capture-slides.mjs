import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';

const cwd = process.cwd();
const outputDir = path.join(cwd, 'artifacts', 'slide-shots');
const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await wait(300);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function startPreviewServer() {
  const child = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], {
    cwd,
    stdio: 'inherit',
    shell: true,
  });

  return child;
}

async function main() {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const useExistingServer = process.env.USE_EXISTING_SERVER === '1';
  const server = useExistingServer ? null : startPreviewServer();

  try {
    console.log(`Waiting for server at ${baseUrl}`);
    await waitForServer(baseUrl);
    console.log('Server is ready');

    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
    });

    const captured = [];
    let index = 1;

    while (true) {
      await page.goto(`${baseUrl}/#slide-${index}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await page.waitForSelector('.deck-slide[data-state="active"] .deck-title', { timeout: 5000 });
      await page.waitForTimeout(500);

      const title = await page.locator('.deck-slide[data-state="active"] .deck-title').innerText();
      const safeTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
      const filename = `slide-${String(index).padStart(2, '0')}-${safeTitle || 'untitled'}.png`;
      const filepath = path.join(outputDir, filename);

      console.log(`Capturing slide ${index}: ${title}`);
      await page.locator('.deck-slide[data-state="active"] .deck-frame').screenshot({ path: filepath });
      captured.push({ index, title, filename });

      const isDisabled = await page.locator('button[aria-label="Next slide"]').isDisabled();
      if (isDisabled) break;
      index += 1;
    }

    await writeFile(path.join(outputDir, 'index.json'), `${JSON.stringify(captured, null, 2)}\n`);
    await browser.close();
  } finally {
    server?.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
