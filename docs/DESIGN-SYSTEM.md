# Design system (founder direction 2026-11-15: futurist, modern, halo graphics and grids)

| Element | Rule |
|---|---|
| Theme | Dark only. Background `night` #03080C, surfaces `deep` #071820, text `ink` #E4F4F3 |
| Glow colors | Blue and pink couple colors (founder, 2026-11-15). Blue #4FA8FF (primary; token `lagoon`), pink #FF6FAE (calls to action; token `mango`), violet #8B7CFF where they blend. Links #8EC5FF |
| Type | Space Grotesk (headings), Inter (body), mono for small uppercase labels. Self-hosted through @fontsource, no outside font requests |
| Halo | `components/Halo.tsx`: two interlocking glowing rings, one blue and one pink (the couple) inside rotating HUD orbits. `HaloIcon` for cards. Pure SVG |
| Grids | `.grid-bg` fading square grid behind sections; `.grid-floor` perspective floor under the hero; bento card grid for features |
| Surfaces | `.glass` translucent panels with blur; `.halo-border` animated conic-gradient edge for the key panel |
| Motion | Slow orbit spin, soft pulse, rotating border. All switched off under "reduce motion" |
| Accessibility | Body text at least 60% ink on night; focus ring in mango; decorative graphics `aria-hidden` |
