<script setup lang="ts">
const url = 'http://localhost:5175/src/design/landing/mar/ds/index.html'
</script>

<template>
  <article class="ds-doc">
    <h1>Mar's design system</h1>
    <p>
      Every component in the default view of Mar's proposal for Comfy Desktop, in every state, dark
      and light side by side. It renders the prototype's real components with their real styles, so
      it can't drift: when a component changes in the prototype, it changes here.
    </p>

    <h2>What it covers</h2>
    <p>
      Only the default view: Proposal Mar, every UI Playground knob at its default. Explorations
      behind other knobs are not here. When the default changes, this page follows.
    </p>

    <h2>Where things come from</h2>
    <ul>
      <li>
        <strong>Token names</strong>: ComfyUI_frontend's design system, through Pablo's prototype
        (<code>landing/ui/tokens.css</code>, light values in <code>ui/looks/light.css</code>).
      </li>
      <li>
        <strong>Base kit</strong>: Pablo's components in <code>landing/ui/</code> (Button, menus,
        Tooltip, SectionHeader, MediaCard…) and his parts in <code>landing/parts/</code>.
      </li>
      <li>
        <strong>Mar's pieces</strong>: <code>landing/mar/</code>. Her look over all of it is
        <code>mar/shell/marShell.css</code>, scoped to <code>[data-mar-ui='on']</code>; light is
        <code>[data-ds-theme='light']</code>.
      </li>
    </ul>
    <p>Each page names its source files and when to use the component.</p>

    <h2>Rules</h2>
    <ul>
      <li>
        <strong>Hover never makes a card bigger.</strong> No lift, no scale, no zoom on the card or
        its picture. A card answers to hover with its surface only, one step lighter.
      </li>
      <li>
        <strong>Menus, popovers and selects are one family</strong>: a hairline edge (7%, 8% in
        light), radius 14 around 6 of padding so items nest at 8, quiet 11.5px labels, inset
        separators, and an entry that grows from the trigger.
      </li>
      <li>Tooltips are small dark glass labels, like the menus, with 8px corners.</li>
      <li>The prompt box has a very faint edge: foreground 7%, 12% while typing.</li>
      <li>
        <strong>Nested corners run parallel</strong>: inner = outer − padding. The mode switch and
        scope tabs are 10 around 3, so their segment is 7.
      </li>
      <li>One primary (white) button per surface.</li>
      <li>Colour is for status only; surfaces are the foreground at low opacity.</li>
    </ul>

    <h2>How to open it</h2>
    <p>
      With the prototype's dev server running (<code>pnpm dev</code>), open
      <a :href="url">{{ url }}</a
      >. The header switches between dark and light side by side, or one of them. Pages are links
      (<code>#/sidebar</code>).
    </p>
    <p>
      It keeps the prototype's settings in memory, so it always shows the defaults and never changes
      what an open prototype tab shows.
    </p>

    <h2>How it is built</h2>
    <ul>
      <li>
        Each theme is a frame of the same page, since the themes live on <code>&lt;html&gt;</code>.
      </li>
      <li>
        Hover, focus and pressed are forced by copying every rule that uses
        <code>:hover</code>, <code>:focus-visible</code> or <code>:active</code> into one that also
        answers to <code>data-ds-force</code> (<code>kit/force.ts</code>).
      </li>
      <li>Open menus and tooltips each get a small frame of their own (<code>stages.ts</code>).</li>
      <li>
        To add a component: a page in <code>pages/</code>, listed in <code>registry.ts</code>.
      </li>
    </ul>
  </article>
</template>
