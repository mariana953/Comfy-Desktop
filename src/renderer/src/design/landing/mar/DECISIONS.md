# Decisions

Open questions from the design-system kickoff with Pablo (2026-10-26) and
where each one stands. "Version" is the Mariana version that carries it.

| #   | Question                                                        | Decision                                                                                                                                                                                    | Status   | Version |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| 1   | Keep the glass / translucent style?                             | No glass borders. Transparency only over imagery and overlays (chips, scrims, the prompt bar). Surfaces are white at low opacity.                                                           | Proposed | v2      |
| 2   | Colour or black and white?                                      | Neutral UI, imagery leads. White primary (one per screen). Colour only for status (running, update, error) and progress. Brand colour only in moments (installer, first run, empty states). | Proposed | v2      |
| 3   | Themes                                                          | Light and dark only; no branded purple theme for now.                                                                                                                                       | Decided  | —       |
| 4   | Workflow tabs: top bar in the app, one level lower in a browser | Open                                                                                                                                                                                        | Open     |         |
| 5   | Agent blends into the canvas                                    | Open. Direction: the agent is its own panel that pushes the canvas, told apart by place, not colour.                                                                                        | Open     |         |
| 6   | Two homes (ComfyUI from Git / Cloud has none)                   | Open. See Figma "IA · Unified".                                                                                                                                                             | Open     |         |
| 7   | Install and first-run flow                                      | Open                                                                                                                                                                                        | Open     |         |
| 8   | Contrast on weaker monitors                                     | Open. Define 4–5 surface and text levels with measured contrast (`pnpm design:contrast`).                                                                                                   | Open     |         |
| 9   | Spaces vs Projects                                              | Open (needs product, Ryan)                                                                                                                                                                  | Open     |         |
| 10  | Reduce tokens                                                   | Later, with Pablo's token tool                                                                                                                                                              | Later    |         |

## Versions

- **v1** (frozen): Pablo's Milestone 10 Home with one Create button and its
  menu (Open ComfyUI, Deploy), build tiles, workflow cards with a meta line,
  one photo series, and a chat icon for the Agent lens. Matches Figma
  "Home v10 · Mariana v1 (combined)".
- **v2** (in progress): starts as v1; takes each decision above as it is
  made.
