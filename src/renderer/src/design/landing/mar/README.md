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
- Workflow cards show a meta line with a value on the right (size, build,
  when).
- One photo series (Magnific stock, `assets/`) for every card.
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
