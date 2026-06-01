# Project Memory

- Current state: 3D mode now supports a stronger full-screen transition intent and a floating glassmorphism info card near the astronaut when approaching zones.
- Fixes applied:
  - Kept the astronaut on a visible surface by using `0.2` as the fallback ground height.
  - Added a scene overlay/card layer for 3D zone hints.
  - Added first-person/cinematic camera state handling for the 3D view toggle flow.
- Edited files:
  - `js/app.js`
  - `index.html`
  - `css/style.css`
  - `ai-memory.md`
- Notes:
  - The zone info card is positioned from the 3D player screen projection and uses a glassmorphism style.
  - The existing zone details panel remains intact and still updates with the active area.
  - No unrelated refactors were introduced.
