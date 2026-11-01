# EVicons design guide

This guide is binding for every icon in `icons/`. The linter (`npm run lint:icons`) enforces the technical rules; the visual rules are checked in the preview (`npm run preview`).

## 1. Scope

EVicons only covers e-mobility and EV charging. General UI icons (arrows, close, search, menu, ...) stay with Lucide in the consuming apps. No brand or manufacturer logos (car makers, charge point operators); standardised connector faces are allowed.

## 2. Style rules

- **Grid:** 24 × 24, `viewBox="0 0 24 24"`. Keep at least 1 px to the edge: everything, including half the stroke, stays inside the live area `[1, 23]`.
- **Root attributes:** exactly `width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`.
- **Stroke:** 1.5 by default (Lucide uses 2). Changed from 1.75 on 2026-10-21 (owner decision). Consumers can change it through the `strokeWidth` prop.
- **Outline only:** no fills, no colours, no opacity. Colour comes from CSS via `currentColor`.
- **Dots:** a dot (question mark, exclamation mark, clock ticks) is a zero-length path with a round cap, `<path d="M x yh.01"/>`; it renders as a solid disc with the stroke width as diameter. Never draw a dot as a tiny `<circle>`: Chromium strokes a circle whose radius is below half the stroke width as a ring with a hole, visible at large sizes. Never use `h0`: SVGO turns it into an empty subpath (`M x yz`). A small solid disc that must be larger than the stroke (the CCS2 contacts) is drawn as a path of two arcs, `M(cx−r) cy a r r 0 1 0 2r 0 r r 0 1 0 −2r 0`, which Chromium fills correctly. The linter rejects `<circle>` and `<ellipse>` radii below 1 (half of stroke width 2, the largest stroke recommended for badges).
- **Soft shapes:** outer corners use radii ≥ 1.25 where possible. Sharp corners only where the subject needs them (lightning bolt, letter apexes); a deliberately sharp corner is declared with the `sharp-corner` exception.
- **Detail:** more inner detail than Lucide, but every icon must stay readable at **16 px**. Check 16, 20 and 24 px, light and dark, in the preview.
- **Optical size:** next to Lucide `Car` or `MapPin` at 20 px an EVicon must not look bigger or smaller. Wide subjects use most of the width (about 19–21 units); round and square subjects stay around 18 units.
- **Spacing:** keep at least 2.5 units between the centre lines of parallel strokes so that a visible gap remains (2.5 − 1.5 = 1.0). Where a subject needs it (connector faces, a symbol inside a window), go down to 2.0 at the very least (0.5 visible gap) and check 16 px. The minimum of 2.0 for a symbol inside a window (for example the bolt in the `charging-station` display) was confirmed by the owner on 2026-10-21.
- **Clean markup:** only flat `path`, `circle`, `rect`, `line`, `polyline` and `ellipse` children; no transforms, ids, classes, inline styles or groups. Files are SVGO-normalised (`npm run lint:icons -- --fix`).
- **Direction:** vehicles face right. Icons are not mirrored for RTL; mirroring is up to the app. Letters and connector faces never mirror.
- **Meaning:** icons complement text, they do not replace it. Every icon documents its precise meaning in its metadata (`meaning.en` / `meaning.de`).
- **Small bolt:** where a small lightning bolt is the EV cue inside another icon (home, card, phone, leaf), it is always the same block: height 6.5, width 4, the vertex layout of the `fast-charging` bolt (top tip right of centre, step to the left, lower tip left of centre) scaled to that box. Relative to its top-left corner `(X, Y)`: `M2.75 0 0 3.5h1.5L1 6.5l3-4H2.25Z` (for example at origin (10, 6.75): `M12.75 6.75 10 10.25h1.5l-.5 3 3-4h-1.75Z`). Its inner spacing is intentionally below 2.0 (smallest 1.0), so at stroke 1.5 the counter closes and the block reads as a solid sign, like a dot. Its tips are sharp like the `fast-charging` bolt. Every icon that uses the block declares `solid-sign` and `sharp-corner`. The spacing between the bolt and everything around it stays at least 2.0. Never scale it per icon; move it. (Marker heads use their own, larger sign; see section 9.)
- **Overlay cut-out:** when the small bolt (or another secondary sign) overlaps an outer contour, the contour is interrupted around it: a real gap in the stroke, not a sign drawn on top. Keep at least 2.0 between the bolt's centre lines and the cut ends of the contour (0.5 visible gap with round caps), and check 16 px.

## 3. Lucide is a visual reference only

All geometry is drawn from scratch. Never copy, trace or adapt Lucide paths (that would carry Lucide's ISC notice obligation and make the set derivative). Lucide icons appear in the preview only so that optical size and stroke weight can be compared side by side. The preview reads them from `lucide-static` at build time; they are never stored in this repository.

## 4. Documented exceptions

Exceptions do not relax any lint rule. They mark a deliberate deviation for reviewers and the preview. Declare them in the icon's metadata (`"exceptions": [...]`).

| Id | Use | Why |
|---|---|---|
| `letters` | Icon contains letters from the EVicons stroke alphabet (AC, DC, R, kW). | Text glyphs are denser than pictograms and need their own construction rules (section 6) so that all lettered icons match. |
| `dense-connector` | Connector faces with many contacts (Type 2, CCS2, ...). | The norm fixes the number and position of the contacts, so spacing falls below the usual 2.5 units. At 16 px some faces are not distinguishable from each other; the app must show the connector name next to the icon. |
| `sharp-corner` | A corner is intentionally sharp despite round joins (lightning bolt tips in `fast-charging`). | The sharp corner carries meaning; rounding it would blur the symbol. |
| `solid-sign` | A small sign whose inner gaps are below the spacing minimum on purpose, so it reads as a solid shape. Declare it on every icon that uses the small-bolt block (section 2). | At icon sizes a hollow sign this small would only show a blurred slit; a solid sign stays crisp. The spacing from the sign to everything around it still follows section 2 (at least 2.0). |

## 5. Connector convention (vehicle inlet)

- A connector icon always shows the **vehicle inlet seen from the front**, the way the driver sees the charging socket on the car.
- The outline follows the inlet's shape, with keying and flattening in their standard position (Type 2: flat side on top).
- Contacts are outline circles in their standard positions. Power contacts are larger than signal contacts.
- **Exception, socket face seen from the front:** a connector that exists only as a socket and never as a vehicle inlet (Schuko, CEE 7/3) shows the socket face as seen from the front, the way the user sees it on the wall. Its metadata still has `standard`.
- Each connector icon has `standard: { norm, source }` in its metadata. The source must name the figure the layout was checked against. Before approval the contact count, sizes and positions are checked against that source, not only visually (see `docs/acceptance/`).

### Type 2 reference geometry (from `plug-type-2`)

Reuse it for CCS2, whose upper part is the Type 2 face.

- Outline: circle `C = (12, 12)`, `R = 9`, flattened by a horizontal edge at `y = 5` (0.778 R above the centre) with fillets of radius 2. The outline spans y 5–21, so the face sits 1 unit below the optical centre; that is accepted to make the flat top visible at 16 px.
- Contact pitch `s = 5.3`; power contacts `r = 1.25`, signal contacts `r = 1.0`.
- Rows (inlet, seen from the front), row spacing 0.70 s above and 0.869 s below the middle row:
  - top, `y = 8.29`: PP at `x = 9.35`, CP at `x = 14.65` (signal, small)
  - middle, `y = 12`: L1 at `x = 6.7`, PE at `x = 12`, N at `x = 17.3`
  - bottom, `y = 16.606`: L2 at `x = 9.35`, L3 at `x = 14.65`
- Smallest gaps (centre lines minus radii): signal contact to flat edge 2.29, signal to power contact 2.31, power contact to outline 2.44.
- At 16–24 px all seven contacts render as similar dots (the hole of a r 1.0 ring is 0.25 units, of a r 1.25 ring 0.75 units). Small and large contacts are only distinguishable in large sizes, so the app must always show the text "Type 2" next to the icon.

### CCS2 reference geometry (from `plug-ccs2`)

The Type 2 part reuses the Type 2 construction above, scaled so that the Type 2 part and the DC part fit one above the other in the live area.

- Type 2 outline: circle `C = (12, 7.1)`, `R = 6.65`, flattened by a horizontal edge at `y = 1.925` (0.778 R above the centre) with fillets of radius 1.5; it spans y 1.925–13.75.
- Contact pitch `s = 3.8` (row ratios 0.70 and 0.869 as for Type 2): top row `y = 4.44` (PP, CP at x 10.1 and 13.9), middle row `y = 7.1` (L1, PE, N at x 8.2, 12, 15.8), bottom row `y = 10.402` (L2, L3 at x 10.1 and 13.9).
- Contact sizes: signal r 0.5, power r 0.75. Both are below half the stroke, so all seven Type 2 contacts render as **dots**, not rings (rings would need a pitch of at least 4.0 and R ≥ 7.0, which does not fit together with the DC part). Accepted by the owner on 2026-10-21 (D1 in `docs/acceptance/v0.1.md`). The seven contacts are drawn as two-arc paths (see "Dots" in section 2), for example PP `M9.6 4.44a.5.5 0 1 0 1 0 .5.5 0 1 0-1 0`, not as `<circle>`, because Chromium would render such small circles as rings.
- DC part: stadium `rect x=5.35 y=15.75 width=13.3 height=6.35 rx=3.175`, 2.0 below the Type 2 outline. DC+ and DC− are r 1.15 at `(8.525, 18.925)` and `(15.475, 18.925)`, concentric with the stadium's round ends (rings).
- Smallest gaps (centre lines minus radii): Type 2 outline to DC part 2.0, signal contact to flat edge 2.015, signal to power contact 2.019, DC contact to stadium 2.025, power contact to outline 2.06; all at or above the connector minimum of 2.0.

### CHAdeMO reference geometry (from `plug-chademo`)

- Outline: circle `C = (12, 12)`, `R = 9` (as Type 2), no flat edge; the keyway and the boss rims are omitted (too fine).
- DC+ and DC−: rings `r = 1.5` at `(7.75, 12)` and `(16.25, 12)`, 0.47 R left and right of the centre (public drawings: 0.45–0.46 R).
- Signal contacts: dots (zero-length paths) at `(10.25, 6.875)`, `(13.75, 6.875)`, `(10.25, 17.125)`, `(13.75, 17.125)`. The two signal bosses sit 0.57 R above and below the centre; of their four contacts each, only the horizontal pair at ±1.75 from the boss centre is drawn (upper: N/C, SS1; lower: C-L, C-H). The centre stays empty.
- Smallest gaps (centre lines minus radii): DC ring to outline 3.25, signal pair 3.5 apart, signal dot to outline 3.58, signal dot to DC ring 4.2.

### Schuko reference geometry (from `plug-schuko`)

Socket face seen from the front (exception above).

- Outline: circle `C = (12, 12)`, `R = 9`, standing for the 39 mm recess.
- Contact holes: solid discs `r = 0.5` (two-arc paths, section 2) at `(7.625, 12)` and `(16.375, 12)`, 8.75 apart (19 mm on 39 mm). Holes are discs, not rings; plain dots are too faint at 16 px.
- Earthing clips: `M10.75 5.75h2.5` and `M10.75 18.25h2.5`, just inside the rim, not touching it.
- Smallest gaps: clip end to outline 2.63 (clip middle 2.75), hole to outline 4.125.

### Side-view plug block (from `charging-plug`)

Reuse it wherever a plug is shown from the side (`charging-cable`, `bidirectional-charging`); the plug points right. The head is a plain rounded box: a collar line inside it closes up with the front face at 16 px, so there is none.

- Full size (`charging-plug`): head `<rect x="8.5" y="5.5" width="9" height="11" rx="2.5"/>` (9 × 11, axis at y 11), prongs `M17.5 9h4m-4 4h4` (4.0 apart, 4.0 long), strain relief `M8.5 9H7a1.25 1.25 0 0 0-1.25 1.25v1.5A1.25 1.25 0 0 0 7 13h1.5` (2.75 × 4, r 1.25); the cable leaves its left side at `(5.75, 11)` with a bend r 2.75 (`M5.75 11a2.75 2.75 0 0 0-2.75 2.75V20`). Cable to strain relief 2.75.
- Small variant (`charging-cable`, about 0.73): head `<rect x="13" y="3.5" width="6.5" height="8" rx="2"/>` (axis at y 7.5), prongs `M19.5 6H22m-2.5 3H22` (3.0 apart, 2.5 long), strain relief `M13 6.25h-.75a1.25 1.25 0 0 0 0 2.5H13` (half round r 1.25); the cable leaves at `(11, 7.5)`.
- Move the block, do not rescale it beyond these two sizes. Keep at least 2.5 between the head and any cable run.

## 6. Letter set

Letters are drawn as strokes with the regular stroke width (1.5), round caps and joins. Coordinates are relative to the letter's top-left corner; to place a letter, add the origin `(X, Y)` to every coordinate.

- **Cap height:** 8 units (baseline at `Y + 8`).
- **Widths (centre line):** A = 6, C = 5.5, D = 5.5, R = 5.
- **Spacing:** 2 units between the boxes of two letters (the next letter starts at `X + width + 2`).
- **Crossbar of A:** at `Y + 5`, from `X + 1.13` to `X + 4.87` (on the legs).

| Letter | Path (relative to origin 0, 0) |
|---|---|
| A | `M0 8L3 0L6 8M1.13 5H4.87` |
| C | `M5.5 1.6C4.8 .6 3.9 0 2.9 0C1.2 0 0 1.8 0 4S1.2 8 2.9 8C3.9 8 4.8 7.4 5.5 6.4` |
| D | `M0 0V8H2C4.2 8 5.5 6.2 5.5 4S4.2 0 2 0Z` |
| R | `M0 8V0H2.5A2.25 2.25 0 0 1 2.5 4.5H0M2.5 4.5 5 8` |
| k | added in Tasks 3/4 |
| W | added in Tasks 3/4 |
| P | added in Tasks 3/4 |

Example: `current-ac` places A at origin `(5.25, 3.75)` and C at `(13.25, 3.75)`, which gives `m5.25 11.75 3-8 3 8m-4.87-3h3.74` and `M18.75 5.35c-.7-1-1.6-1.6-2.6-1.6-1.7 0-2.9 1.8-2.9 4s1.2 4 2.9 4c1 0 1.9-.6 2.6-1.6` after SVGO.

A and C are tested at 16 px in `current-ac`; D is tested at 16 px in `current-dc` (D at origin (5.5, 3.75), C at (13, 3.75)): readable, its counter stays open. R is used alone in `status-reserved` at origin (9.5, 8): stem from the baseline to the cap line, bowl a half circle r 2.25 from y 0 to y 4.5 (slightly above the middle, counter 3.0 high, 1.5 visible), leg from the bowl's end at (2.5, 4.5) to (5, 8). Tested at 16 px: readable, counter open. k, W and P are added to this table together with the icons that need them (`parking-charging`, `power-kw`).

## 7. Status icons

- Every `status-*` icon uses the same frame: `<circle cx="12" cy="12" r="9"/>`.
- The inner sign carries the meaning (hand holding a plug = available, clock = occupied, two cars one behind the other = queue, letter R = reserved, exclamation mark = faulted, crossed-out plug = out of service, question mark = unknown). Shape alone must identify the status, because the app may render all of them in the same colour.
- Keep the inner sign inside a radius of about 5.5 around the centre, so that at least 2.5 units remain to the frame.
- Check mark block (no longer used by a status icon since `status-available` became the hand with plug on 2026-10-21; reuse it wherever EVicons needs a check): `M7.75 12.5 10.5 15l5.75-6.25`. It has a short leg of 2.75 × 2.5 and a long, steep leg of 5.75 × 6.25, drawn for EVicons and not taken from Lucide.
- Question mark and exclamation mark are a pair (`status-unknown`, `status-faulted`): both reach from y 6.75 down to a stroke end at (12, 13.75) and share the same dot `<path d="M12 16.5h.01"/>`, 2.5 below that stroke end. Exclamation mark block: `M12 6.75v7` plus the dot. Question mark block: `M9.5 9.25a2.5 2.5 0 1 1 3.75 2.165c-.75.43-1.25.95-1.25 1.835v.5` plus the dot.
- Upright plug block (`status-available`; same prong length 1.75 and prong spacing 2.5 as the crossed-out plug): prongs `M12.25 6.25V8m2.5-1.75V8`, body `<rect x="10.75" y="8" width="5.5" height="3.5" rx="1.25"/>`. Prongs are short lines, not dots.
- Holding hand block (`status-available`, candidate A6, chosen by the owner on 2026-10-21): a closed mitten silhouette lying flat, fingers to the right, thumb raised on the left; the plug stands on the palm. One closed stroke `M6.25 11.5A1 1 0 0 1 8 10.85L10.5 14h5a1.5 1.5 0 0 1 0 3h-6a3.25 3.25 0 0 1-3.25-3.25Z`: thumb tip r 1 at (7.25, 11.5), the thumb's inner edge running down to the palm at (10.5, 14), flat palm top y 14, round fingertip r 1.5 at x 17, back of the hand y 17, wrist rounded r 3.25. Gaps: thumb to plug 2.26, plug bottom to palm 2.5, fingertip to frame 2.55. Rejected: a cup or arc under the plug (with the plug and a thumb it reads as a smiling face).
- Car front block (`status-queue`): front car body `<rect x="7" y="13" width="10" height="3.25" rx="1.25"/>`, greenhouse `M9 13 10 10.75h4l1 2.25`, wheels `M8.75 16.25v1m6.5-1v1`. The car behind is the same car shifted up and partly hidden: only its roof and shoulders show, `M7 11v-1a1.25 1.25 0 0 1 1.25-1.25L9.5 6.5h5l1.25 2.25A1.25 1.25 0 0 1 17 10v1`. Gaps: rear shoulders to front body 2.23, rear outline to front greenhouse 2.64.
- Letter R (`status-reserved`): the R of the letter set (section 6) at origin (9.5, 8), cap height 8, no further detail. Exception `letters`.
- Crossed-out sign: the diagonal runs from top left to bottom right through the centre (`M7.934 7.934 16.066 16.066`, 5.75 from the centre). Every stroke of the crossed-out pictogram is cut so that its end points stay at least 2.5 from the diagonal's centre line (1.0 visible gap with round caps). Pictograms that are crossed out are drawn on the other diagonal (axis from bottom left to top right), so that the diagonal cuts across them instead of running along them.
- Colour is applied by the app through CSS (for example green for available). The SVG never contains colour.

### Overlay pattern

To combine a status with another icon (charging station, map pin), place a small status icon absolutely in the bottom-right corner. EVicons does not reserve a badge corner yet; a real badge system is considered after 1.0.

```tsx
import { ChargingStation, StatusAvailable } from '@evicons/react'

export function StationWithStatus() {
  return (
    <span style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
      <ChargingStation size={24} />
      <StatusAvailable
        size={12}
        absoluteStrokeWidth
        strokeWidth={1.5}
        title="Available"
        style={{ position: 'absolute', right: -4, bottom: -4, color: 'green' }}
      />
    </span>
  )
}
```

Use a badge size of half the base icon. At 12 px the default stroke scales down to 0.75 px and looks faint, so give badges a fixed screen stroke: `absoluteStrokeWidth` with `strokeWidth={1.5}` (or `strokeWidth={2}` without `absoluteStrokeWidth`). The bottom-right badge covers part of the base icon (on `charging-station` the hanging plug); that is accepted for the overlay pattern. If the badge sits on a busy background, give it a background circle in the app (for example a `span` with `border-radius: 50%` and the page background colour).

## 8. Metadata and provenance

Each icon has `<name>.json` next to `<name>.svg` (schema in `tools/lib/meta.ts`): category, meaning (en/de), tags (en/de/fr), `since`, aliases, optional `standard` and `exceptions`, and `provenance`:

- `createdBy`: `"ai"` or `"human"`, without product names.
- `approvedBy` / `approvedOn`: `null` until the owner (Landolsi Digital) approves the icon in the preview; `approvedBy` holds the company name, never a person; a release (`npm run lint:icons -- --release`) requires both.

## 9. Markers

Map markers (category `marker`) are pins with a sign inside. They are drawn like every other icon (outline only, stroke 1.5, `currentColor`), but apps also render them filled.

- **Pin geometry:** a drop. Head circle centre `(12, 10)`, `r = 7.5`; straight flanks tangent to the head run to the tip `(12, 22)`. The tangent points are `(6.145, 14.688)` and `(17.855, 14.688)`, so the pin is `M12 22 6.145 14.688A7.5 7.5 0 1 1 17.855 14.688Z` (after SVGO `m12 22-5.855-7.312a7.5 7.5 0 1 1 11.71 0Z`). It spans x 4.5–19.5 and y 2.5–22.
- **Element order is a contract:** the pin is the **first** child element of `<svg>`, one `<path>` with a single closed subpath (one `M`, one `Z` at the end) that encloses every other element. The sign follows after it. The linter enforces this for category `marker` (`marker: first element must be a single closed <path> (the pin)`). Never reorder the elements of a released marker; apps rely on `:first-child`.
- **Sign:** inside the head, at least 2.0 between the sign's centre lines and the pin outline. The sign in a marker head is larger than the small-bolt block of section 2: a bolt about 10 high, hollow, with inner spacing of at least 2.0 (as measured on the comparison page). The small-bolt block is for signs inside other icons, not for markers. Signs are simplified, not thinned: the stroke stays 1.5 and no exception relaxes it. Letters (`marker-ac`, `marker-dc`) use cap height 5.25 and declare `letters`; `!`, `?` and `x` are signs, not letters.
- **Filled mode (CSS only):** the SVG never contains a fill or a colour. Apps fill the pin and draw the sign in white:

```css
.marker svg > path:first-child { fill: currentColor; }
.marker svg > :not(:first-child) { stroke: #fff; }
```

  The pin keeps its `currentColor` stroke, so a filled pin looks 0.75 larger than its outline; that is intended.
- **Check sizes:** 24, 32 and 40 px (not 16), light and dark, outline and filled. The preview shows markers in their own section and on a map mock in both modes; `npm run snap -- <out.png> <name>...` renders the same grid to a PNG.
