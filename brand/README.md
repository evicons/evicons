# EVicons brand

The EVicons logo: a mark and a horizontal lockup (mark + wordmark). Like the icons, the logo files are outline drawings in `currentColor`, so they take the colour of the surrounding text.

| File | What |
|---|---|
| `logo.svg` | Lockup: mark + wordmark "EVicons" (wordmark drawn as strokes, no font needed) |
| `logo-mark.svg` | Mark only, 24 × 24 grid |
| `logo-on-light.png` | Lockup, 1600 px wide, dark on transparent, for light backgrounds |
| `logo-on-dark.png` | Lockup, 1600 px wide, light on transparent, for dark backgrounds |

The favicons and the social image of evicons.dev are in `site/public/` and are rendered with `node site/scripts/render-og.mjs`.

## The mark

The mark is the outline of a Type 2 vehicle inlet (the contour of `plug-type-2`, contacts removed) with the `charging-bolt` inside. It sits on the icon grid with the icon stroke (24 × 24, stroke 1.5, round caps and joins), so it matches the icon set at the same size. The favicon uses a slightly heavier stroke (1.75) so it holds up at 16 px.

The wordmark is set from the EVicons letter set (see `docs/design-guide.md`, section 6) at the same stroke as the mark; "EV" is drawn slightly heavier than "icons". On evicons.dev the header shows the mark next to the wordmark set in Inter ("EV" semibold, "icons" regular).

## Rules

- **Clear space:** keep free space around the logo at least as large as the height of the bolt in the mark.
- **Minimum size:** mark 16 px, lockup 120 px wide.
- **Colour:** use the logo in one colour, either `currentColor` (the text colour around it) or EV blue `#2563eb`. Do not recolour parts of it, and do not use other colours.
- **Do not distort:** scale it only proportionally; do not stretch, slant, rotate or rearrange the mark and the wordmark.
- **No effects:** no shadows, outlines, gradients, glows or backgrounds behind the strokes.
- **Spelling:** write the name as **EVicons**: capital E and V, lowercase "icons", one word. Not "EV Icons", "EV-icons", "Evicons" or "evicons" (the lowercase form is only used in the domain evicons.dev and the npm scope `@evicons`).

## Colours

| Name | Hex | Use |
|---|---|---|
| EV blue | `#2563eb` | Accent: links, buttons, the mark on evicons.dev |
| Available | `#16a34a` | Status demo colour |
| Occupied | `#d97706` | Status demo colour |
| Faulted | `#dc2626` | Status demo colour |
| Out of service | `#71717a` | Status demo colour |
| Unknown | `#0891b2` | Status demo colour |
| Reserved | `#7c3aed` | Status demo colour |
| Queue | `#c2410c` | Status demo colour |

The status colours are suggestions for apps; the icons themselves contain no colour. Neutrals come from the Tailwind zinc scale.

