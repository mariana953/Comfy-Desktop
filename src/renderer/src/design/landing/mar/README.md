# Mariana's proposal

Lives apart from Pablo's prototype. Pick it in the Prototype menu
(Proposal: Pablo or Mar, the first section) or open the preview with
`?proposal=mariana`.

Mar's proposal always shows Pablo's latest milestone (first run included,
which keeps his example cards). Picking another milestone switches to
Pablo's at that milestone. What changed and why is in
[DECISIONS.md](DECISIONS.md).

## UI and the tuner

The menu's **UI** section picks the look: **Void** (the main one) or the
other directions in `ui/looks/`. **Tune the UI…** opens a panel with live
knobs on top of it (corners, text size, surfaces, borders, shadows, chips on
images, focus colour), saved per browser. The knobs live in `uiTuner.ts`.

## What it changes

- Home: one Create button top right; Open ComfyUI and Deploy are its menu.
- Builds on Home are tiles: where it runs and its state on top, name and
  place below.
- Greeting and prompt box sit higher; the prompt box is two lines tall.
- Example workflows are Pablo's hand of cards (interactive), in the same
  column as the prompt and the builds.
- Recent workflows are cards with a meta line and a value on the right
  (build, when), with one photo series (Magnific stock, `assets/`).
- What's new is one full-width branded banner at a time (`LaunchBanner.vue`):
  a looping visual, one centred message, a white CTA, dots. Gradients stand in
  until the brand-kit loops from Magnific land in `assets/`.
- The Agent lens uses a chat bubble icon.

## How it stays apart

Everything new is in this folder. Pablo's files only gain small hooks:

- `prototypeOptions.ts`: the Proposal, UI and Tune groups.
- `comfyTitleBar/TitleBarApp.vue`: the Prototype menu shows a heading per
  section, with Proposal first.
- `LandingPrototypes.vue`: mounts the UI tuner.
- `pages/modes/ModePages.vue`: Home goes through `HomeEntry.vue`.
- `variants/VariantModes.vue`: the Agent icon comes from `proposal.ts`.

With Proposal: Pablo, the prototype is exactly his.

## Daily sync with Pablo's branch

`scripts/design/sync-pablo.sh` merges `origin/PabloWiedemann/instances-landing-prototypes`
into the current branch. It never rewrites history and stops on a conflict.
