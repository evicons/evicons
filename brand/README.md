# EVicons brand

The EVicons logo: a mark and a horizontal lockup (mark + wordmark "evicons.dev"). The mark is EV blue; the wordmark is drawn in `currentColor`, so it takes the colour of the surrounding text and the same file works on light and dark backgrounds.

| File | What |
|---|---|
| `logo.svg` | Lockup: mark + wordmark "evicons.dev" (outlined, no font needed) |
| `logo-mark.svg` | Mark only, square |
| `logo-on-light.png` | Lockup, 1600 px wide, dark on transparent, for light backgrounds |
| `logo-on-dark.png` | Lockup, 1600 px wide, light on transparent, for dark backgrounds |

The favicons and the social image of evicons.dev are in `site/public/` and are rendered with `node site/scripts/render-og.mjs`.

## The mark

The mark is a lowercase e drawn as a charging cable that ends in a plug. It is a filled shape in EV blue `#2563eb`.

The wordmark "evicons" uses `currentColor`; ".dev" uses the same colour at 65 % opacity. The favicon is the mark on its own (EV blue, a lighter blue `#60a5fa` in dark mode).

## Rules

- **Clear space:** keep free space around the logo at least as large as the plug in the mark.
- **Minimum size:** mark 16 px, lockup 120 px wide.
- **Colour:** the mark is EV blue `#2563eb`, the wordmark takes the text colour around it. On a single-colour background where blue does not work, the whole logo may be one colour. Do not use other colours.
- **Do not distort:** scale it only proportionally; do not stretch, slant, rotate or rearrange the mark and the wordmark.
- **No effects:** no shadows, outlines, gradients or glows.
- **Spelling:** write the name as **EVicons**: capital E and V, lowercase "icons", one word. Not "EV Icons", "EV-icons", "Evicons" or "evicons" (the lowercase form is only used in the logo, the domain evicons.dev and the npm scope `@evicons`).

## Colours

| Name | Hex | Use |
|---|---|---|
| EV blue | `#2563eb` | Accent: the mark, links, buttons |
| Available | `#16a34a` | Status demo colour |
| Occupied | `#d97706` | Status demo colour |
| Faulted | `#dc2626` | Status demo colour |
| Out of service | `#71717a` | Status demo colour |
| Unknown | `#0891b2` | Status demo colour |
| Reserved | `#7c3aed` | Status demo colour |
| Queue | `#c2410c` | Status demo colour |

The status colours are suggestions for apps; the icons themselves contain no colour. Neutrals come from the Tailwind zinc scale.

