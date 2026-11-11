# Best practices pass (Wave 14)

## Done

- **Playtest bot is a tool, not a one-off:** `npm run playtest` (separate Vitest config,
  never in CI). Re-run it after every balance change so missions stay winnable.
- **Invariant tests:** random players run sandbox and mission games and check every
  week that money and reputation are real numbers, schedules only point at existing
  shows or movies, nothing airs twice, people never go below 0 uses, projects keep their
  people, shows keep their IP, and the save survives a JSON round trip at the current
  version.
- **Save tests:** 3 independent slots, the old single-save key loads as slot 1, a corrupt
  save falls back to its backup, newer-version saves are refused with a message, the
  profile keeps the best stars, and a full or blocked storage reports instead of
  crashing.
- **Found by the tests:** event choices you couldn't afford could be tapped and then
  failed with an error. Choices now carry their cost; the event window disables the ones
  you can't afford (every event keeps a free option).
- **Error boundary:** a crash while drawing a screen shows a recovery screen (back to the
  menu, or reload) instead of a blank page. The last good save is kept.
- **Smaller App component:** the Home to-do list moved to `src/ui/todos.ts` (pure,
  tested).
- **Housekeeping:** removed unused menu styles; README rewritten (commands, layout, rules
  of thumb: save versions, engine purity, GameError).

## Later

- UI component tests (React Testing Library) for the menu and the new-show wizard.
- Split `NewShowWizard` (370 lines) into step components.
- A lint step (ESLint + react-hooks rules) in CI.
