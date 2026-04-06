import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const baseUrl = process.env.BACKGROUND_BENCH_URL ?? 'http://127.0.0.1:4173/';
const outputDir = new URL('../artifacts/', import.meta.url);
const screenshotPath = new URL('./benchmark-background.png', outputDir);
const slideSequence = [1, 4, 8, 12, 14];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function collect(slide) {
  await page.goto(`${baseUrl}#slide-${slide}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  return page.evaluate(() => window.__openclawDeckBackgroundStats);
}

const results = [];
for (const slide of slideSequence) {
  results.push({ slide, stats: await collect(slide) });
}

await page.screenshot({ path: fileURLToPath(screenshotPath), fullPage: true });
await browser.close();

const frameValues = results.map((entry) => entry.stats?.avgFrameMs ?? 0).filter(Boolean);
const p95Values = results.map((entry) => entry.stats?.p95FrameMs ?? 0).filter(Boolean);
const summary = {
  baseUrl,
  slides: results,
  aggregate: {
    avgFrameMs: frameValues.reduce((sum, value) => sum + value, 0) / Math.max(1, frameValues.length),
    worstP95FrameMs: Math.max(0, ...p95Values),
  },
};

console.log(JSON.stringify(summary, null, 2));
