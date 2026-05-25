# Project Memory

- Current issue: 3D scene rendered black because `getGroundHeight()` could return `-100` for positions outside islands/rocks, pushing the astronaut far below the visible world.
- Fix applied: changed the fallback ground height to `0.2` so the player stays on a visible surface.
- Edited files:
  - `js/app.js`
  - `ai-memory.md`
- Notes:
  - 3D scene still uses the existing lighting, sky, and theme system.
  - No other unrelated logic was changed.
