# Mariana's proposal

Lives apart from Pablo's prototype. Switch with the **Pablo | Mar** tabs at
the top of the window, or open the preview with `?proposal=mariana`.

Mar's proposal always shows Pablo's latest milestone (first run included,
which keeps his example cards). Picking another milestone in the Prototype
menu switches to Pablo's at that milestone. What changed and why is in
[DECISIONS.md](DECISIONS.md).

## What it changes

- Home: one Create button top right; Open ComfyUI and Deploy are its menu.
- Builds on Home are tiles: where it runs and its state on top, name and
  place below.
- Greeting and prompt box sit higher; the prompt box is two lines tall.
- Example workflows are Pablo's hand of cards (interactive), in the same
  column as the prompt and the builds.
- Recent workflows are cards with a meta line and a value on the right
  (build, when), with one photo series (Magnific stock, `assets/`).
- The Agent lens uses a chat bubble icon.

## How it stays apart

Everything new is in this folder. Pablo's files only gain three hooks:

- `LandingPrototypes.vue`: mounts the Pablo | Mar tabs.
- `pages/modes/ModePages.vue`: Home goes through `HomeEntry.vue`.
- `variants/VariantModes.vue`: the Agent icon comes from `proposal.ts`.

With Proposal: Pablo, the prototype is exactly his.

## Daily sync with Pablo's branch

`scripts/design/sync-pablo.sh` merges `origin/PabloWiedemann/instances-landing-prototypes`
into the current branch. It never rewrites history and stops on a conflict.
