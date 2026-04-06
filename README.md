# Productionising OpenClaw Slides

Slide deck website for Will's 2026-04-09 talk, built as a conventional React + Vite + Tailwind app.

## Requirements

- Node.js 22+
- npm 10+

## Local development

```bash
npm install
npm run dev
```

Vite will print a local URL, typically `http://localhost:5173`.

## Build for production

```bash
npm run build
```

The static output is written to `dist/`.

## Speaker notes

- Talk notes live in `SPEAKER_NOTES.md`.
- The visible deck is intentionally lean; use the notes file for the richer talk track.

## Project structure

- `index.html`: single HTML shell
- `src/main.jsx`: React root entry
- `src/App.jsx`: app tree, deck navigation, transitions, fullscreen behavior
- `src/slides.js`: canonical slide data and background scene targets
- `src/index.css`: Tailwind import and deck-specific styling
- `SPEAKER_NOTES.md`: expanded speaking notes and talk track
