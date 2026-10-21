# EVicons design guide

This guide is binding for every icon in `icons/`. The linter (`npm run lint:icons`) enforces the technical rules; the visual rules are checked in the preview (`npm run preview`).

## 1. Scope

EVicons only covers e-mobility and EV charging. General UI icons (arrows, close, search, menu, ...) stay with Lucide in the consuming apps. No brand or manufacturer logos (car makers, charge point operators); standardised connector faces are allowed.

## 2. Style rules

- **Grid:** 24 × 24, `viewBox="0 0 24 24"`. Keep at least 1 px to the edge: everything, including half the stroke, stays inside the live area `[1, 23]`.
- **Root attributes:** exactly `width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`.
- **Stroke:** 1.5 by default (Lucide uses 2). Changed from 1.75 on 2026-10-21 (owner decision). Consumers can change it through the `strokeWidth` prop.
- **Outline only:** no fills, no colours, no opacity. Colour comes from CSS via `currentColor`. A circle with `r` below half the stroke (0.875) renders as a dot; that is allowed for small contacts, it is still a stroke.
- **Soft shapes:** outer corners use radii ≥ 1.25 where possible. Sharp corners only where the subject needs them (lightning bolt, letter apexes); a deliberately sharp corner is declared with the `sharp-corner` exception.
- **Detail:** more inner detail than Lucide, but every icon must stay readable at **16 px**. Check 16, 20 and 24 px, light and dark, in the preview.
- **Optical size:** next to Lucide `Car` or `MapPin` at 20 px an EVicon must not look bigger or smaller. Wide subjects use most of the width (about 19–21 units); round and square subjects stay around 18 units.
- **Spacing:** keep at least 2.5 units between the centre lines of parallel strokes so that a visible gap remains (2.5 − 1.5 = 1.0). Where a subject needs it (connector faces, a symbol inside a window), go down to 2.0 at the very least (0.5 visible gap) and check 16 px. The minimum of 2.0 for a symbol inside a window (for example the bolt in the `charging-station` display) was confirmed by the owner on 2026-10-21.
- **Clean markup:** only flat `path`, `circle`, `rect`, `line`, `polyline` and `ellipse` children; no transforms, ids, classes, inline styles or groups. Files are SVGO-normalised (`npm run lint:icons -- --fix`).
- **Direction:** vehicles face right. Icons are not mirrored for RTL; mirroring is up to the app. Letters and connector faces never mirror.
- **Meaning:** icons complement text, they do not replace it. Every icon documents its precise meaning in its metadata (`meaning.en` / `meaning.de`).

## 3. Lucide is a visual reference only

All geometry is drawn from scratch. Never copy, trace or adapt Lucide paths (that would carry Lucide's ISC notice obligation and make the set derivative). Lucide icons appear in the preview only so that optical size and stroke weight can be compared side by side. The preview reads them from `lucide-static` at build time; they are never stored in this repository.

## 4. Documented exceptions

Exceptions do not relax any lint rule. They mark a deliberate deviation for reviewers and the preview. Declare them in the icon's metadata (`"exceptions": [...]`).

| Id | Use | Why |
|---|---|---|
| `letters` | Icon contains letters from the EVicons stroke alphabet (AC, DC, kW). | Text glyphs are denser than pictograms and need their own construction rules (section 6) so that all lettered icons match. |
| `dense-connector` | Connector faces with many contacts (Type 2, CCS2, ...). | The norm fixes the number and position of the contacts, so spacing falls below the usual 2.5 units. At 16 px some faces are not distinguishable from each other; the app must show the connector name next to the icon. |
| `sharp-corner` | A corner is intentionally sharp despite round joins (lightning bolt tips in `fast-charging`). | The sharp corner carries meaning; rounding it would blur the symbol. |

## 5. Connector convention (vehicle inlet)

- A connector icon always shows the **vehicle inlet seen from the front**, the way the driver sees the charging socket on the car.
- The outline follows the inlet's shape, with keying and flattening in their standard position (Type 2: flat side on top).
- Contacts are outline circles in their standard positions. Power contacts are larger than signal contacts.
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
- Contact sizes: signal r 0.5, power r 0.75. Both are below half the stroke, so all seven Type 2 contacts render as **dots**, not rings (rings would need a pitch of at least 4.0 and R ≥ 7.0, which does not fit together with the DC part). Accepted by the owner on 2026-10-21 (D1 in `docs/acceptance/v0.1.md`).
- DC part: stadium `rect x=5.35 y=15.75 width=13.3 height=6.35 rx=3.175`, 2.0 below the Type 2 outline. DC+ and DC− are r 1.15 at `(8.525, 18.925)` and `(15.475, 18.925)`, concentric with the stadium's round ends (rings).
- Smallest gaps (centre lines minus radii): Type 2 outline to DC part 2.0, signal contact to flat edge 2.015, signal to power contact 2.019, DC contact to stadium 2.025, power contact to outline 2.06; all at or above the connector minimum of 2.0.

## 6. Letter set

Letters are drawn as strokes with the regular stroke width (1.5), round caps and joins. Coordinates are relative to the letter's top-left corner; to place a letter, add the origin `(X, Y)` to every coordinate.

- **Cap height:** 8 units (baseline at `Y + 8`).
- **Widths (centre line):** A = 6, C = 5.5, D = 5.5.
- **Spacing:** 2 units between the boxes of two letters (the next letter starts at `X + width + 2`).
- **Crossbar of A:** at `Y + 5`, from `X + 1.13` to `X + 4.87` (on the legs).

| Letter | Path (relative to origin 0, 0) |
|---|---|
| A | `M0 8L3 0L6 8M1.13 5H4.87` |
| C | `M5.5 1.6C4.8 .6 3.9 0 2.9 0C1.2 0 0 1.8 0 4S1.2 8 2.9 8C3.9 8 4.8 7.4 5.5 6.4` |
| D | `M0 0V8H2C4.2 8 5.5 6.2 5.5 4S4.2 0 2 0Z` |

Example: `current-ac` places A at origin `(5.25, 3.75)` and C at `(13.25, 3.75)`, which gives `m5.25 11.75 3-8 3 8m-4.87-3h3.74` and `M18.75 5.35c-.7-1-1.6-1.6-2.6-1.6-1.7 0-2.9 1.8-2.9 4s1.2 4 2.9 4c1 0 1.9-.6 2.6-1.6` after SVGO.

A and C are tested at 16 px in `current-ac`; D is tested at 16 px in `current-dc` (D at origin (5.5, 3.75), C at (13, 3.75)): readable, its counter stays open. More letters (k, W) are added to this table when an icon needs them.

## 7. Status icons

- Every `status-*` icon uses the same frame: `<circle cx="12" cy="12" r="9"/>`.
- The inner sign carries the meaning (check = available, clock = occupied, exclamation mark = faulted, crossed-out plug = out of service, calendar sheet = reserved, question mark = unknown). Shape alone must identify the status, because the app may render all of them in the same colour.
- Keep the inner sign inside a radius of about 5.5 around the centre, so that at least 2.5 units remain to the frame.
- Check mark block (used by `status-available`, reuse it wherever EVicons needs a check): `M7.75 12.5 10.5 15l5.75-6.25`. It has a short leg of 2.75 × 2.5 and a long, steep leg of 5.75 × 6.25, drawn for EVicons and not taken from Lucide.
- Question mark and exclamation mark are a pair (`status-unknown`, `status-faulted`): both reach from y 6.75 down to a stroke end at (12, 13.75) and share the same dot `<circle cx="12" cy="16.5" r=".25"/>`, 2.5 below that stroke end. Exclamation mark block: `M12 6.75v7` plus the dot. Question mark block: `M9.5 9.25a2.5 2.5 0 1 1 3.75 2.165c-.75.43-1.25.95-1.25 1.835v.5` plus the dot.
- Calendar sheet block (`status-reserved`): `<rect x="8" y="9" width="8" height="7.5" rx="1.25"/>`, two binding tabs `M10 7.25V9` and `M14 7.25V9` that end on the top edge, header line `M8 11.5h8` (2.5 below the top edge). No inner mark: a day dot was tried and does not read at 16 px.
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

Use a badge size of half the base icon. At 12 px the default stroke scales down to 0.875 px and looks faint, so give badges a fixed screen stroke: `absoluteStrokeWidth` with `strokeWidth={1.5}` (or `strokeWidth={2}` without `absoluteStrokeWidth`). The bottom-right badge covers part of the base icon (on `charging-station` the hanging plug); that is accepted for the overlay pattern. If the badge sits on a busy background, give it a background circle in the app (for example a `span` with `border-radius: 50%` and the page background colour).

## 8. Metadata and provenance

Each icon has `<name>.json` next to `<name>.svg` (schema in `tools/lib/meta.ts`): category, meaning (en/de), tags (en/de/fr), `since`, aliases, optional `standard` and `exceptions`, and `provenance`:

- `createdBy`: `"ai"` or `"human"`, without product names.
- `approvedBy` / `approvedOn`: `null` until the owner approves the icon in the preview; a release (`npm run lint:icons -- --release`) requires both.
