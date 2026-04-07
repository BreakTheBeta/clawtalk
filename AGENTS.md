# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the app code:
  `App.jsx` for deck navigation and layout, `slides.js` for canonical slide content, `backgroundRenderer.js` for the canvas background, and `safety-check.mjs` for repo-level validation.
- `scripts/` holds utility scripts such as `benchmark-background.mjs`.
- `docs/` stores speaker notes, deploy notes, visual references, and archived planning material.
- `index.html` is the single Vite entry shell.
- `dist/` and `artifacts/` are generated outputs and should not be committed.

## Build, Test, and Development Commands

- `npm run dev`: start the local Vite dev server.
- `npm run build`: create the production build in `dist/`.
- `npm run preview`: serve the built site locally.
- `npm run check`: run the lightweight safety check for required entrypoint references.
- `npm run verify`: run `check` and `build` together; use this before submitting changes.
- `npm run benchmark:bg`: capture background renderer benchmark output into `artifacts/`.

## Coding Style & Naming Conventions

- Use ES modules, React function components, and 2-space indentation.
- Keep files ASCII unless a file already requires other characters.
- Prefer clear, descriptive names: `DeckBackground`, `renderBody`, `buildSystem`.
- Slide data belongs in `src/slides.js`; avoid scattering copy or scene config across components.
- Reuse existing helpers before adding new ones, especially in rendering and layout code.
- There is no configured formatter or linter in this repo, so match the surrounding style exactly.

## Testing Guidelines

- There is no formal automated test suite yet.
- Minimum validation for any change is `npm run verify`.
- If you touch the renderer or slide transitions, also run the deck locally with `npm run dev`.
- Utility scripts should use `.mjs` and be runnable directly from `npm` scripts.

## Commit & Pull Request Guidelines

- Git history is currently sparse and informal (`ww/init`, `ww/cleanuepd the slides`). Keep new commits short, imperative, and scoped, for example: `deck: simplify slide layout`.
- Keep commits focused; separate cleanup, copy updates, and rendering changes when practical.
- PRs should include a short summary, note visible slide changes, list validation commands run, and attach screenshots for UI-affecting updates.

## Repository-Specific Notes

- Do not commit generated screenshots, `.playwright-artifacts`, `dist/`, or `artifacts/`.
- If you change entry files or structure, make sure `src/safety-check.mjs` still reflects reality.
