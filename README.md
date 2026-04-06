# Productionising OpenClaw Slides

Static slide deck for Will's 2026-04-09 talk, built with React, Vite, and Tailwind CSS.

## Requirements

- Node.js 22+
- npm 10+

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run verify
```

`npm run benchmark:bg` is optional. It saves its screenshot output under `artifacts/`.

## Project structure

- `src/`: app code, slide data, canvas background renderer, and safety check
- `docs/`: speaker notes, deployment notes, reference images, and archived planning docs
- `scripts/`: local utility scripts

## Editing notes

- Slide content lives in `src/slides.js`.
- The interactive deck shell lives in `src/App.jsx`.
- The animated background renderer lives in `src/backgroundRenderer.js`.
- Speaker notes live in `docs/speaker-notes.md`.

## Output

Production assets are built into `dist/`, which is ignored from git.
