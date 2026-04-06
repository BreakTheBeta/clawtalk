# Deck Guardrails

The deck now boots through `src/bootstrap.js`, not `src/main.js` directly.

Why:
- if the main app code breaks or moves, the bootstrap layer still loads first
- the user sees a loading overlay instead of an unstyled flash
- boot failures degrade into a visible error state instead of a weird half-broken page

Validation commands:
- `npm run check` -> verifies key entrypoint references exist
- `npm run verify` -> check + production build

Editing rule:
- if changing entry files, update both `index.html` and `src/safety-check.mjs`
- prefer keeping `bootstrap.js` small and stable
