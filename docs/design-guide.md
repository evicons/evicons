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
- **Small bolt:** where a small lightning bolt is the EV cue inside another icon (home, card, phone, leaf), it is always the same block: height 6.5, width 4, the vertex layout of the `fast-charging` bolt (top tip right of centre, step to the left, lower tip left of centre) scaled to that box. Relative to its top-left corner `(X, Y)`: `M2.75 0 0 3.5h1.5L1 6.5l3-4H2.25Zm-1.25 3.5.75-1` (for example at origin (10, 6.75): `M12.75 6.75 10 10.25h1.5l-.5 3 3-4h-1.75Zm-1.25 3.5.75-1`). The short stroke between the two inner corners closes the pinhole the outline leaves at its widest point at sizes above about 48 px (since 0.2.1; `tests/solid-bolt.test.ts` checks it). Its inner spacing is intentionally below 2.0 (smallest 1.0), so at stroke 1.5 the counter closes and the block reads as a solid sign, like a dot. Its tips are sharp like the `fast-charging` bolt. Every icon that uses the block declares `solid-sign` and `sharp-corner`. The spacing between the bolt and everything around it stays at least 2.0. Never scale it per icon; move it. Placed so far (origin of the block): `home-charging` (10, 10.75), `solar-charging` (15, 13.5; over the module's bottom-right corner with an overlay cut-out), `green-power` (16.5, 14), `parking-charging` (14.5, 11.25), `car-electric` (9.25, 7.5; in the window and door area of the car, across the window line, which is cut out around it with its cut ends 2.0 from the bolt), `battery-charging` (8.75, 8.75; centred in the battery body, 2.0 to its top and bottom edge), `driving-range` (18, 2.5; top right of the road, 3.8 from the right road edge), `charging-card` (4.75, 8.75; left in the card, 2.5 from its left edge), `app-charging` (10, 9.75; centred in the phone below the speaker line), `roaming` (15.75, 13.5; over the globe's bottom-right rim with an overlay cut-out, 2.0 from the meridian), `charging-tariff` (10.75, 9.5; in the tag body, 3.0 from its sides), `charging-log` (15, 15.25; over the sheet's bottom-right corner with an overlay cut-out), `charging-operator` (15, 11.5; over the building's bottom-right corner with an overlay cut-out: the right wall ends 2.14 above the bolt, the ground line runs 2.5 below it), `destination-charging` (17, 4.5; above the foot end of the bed, 2.5 above the mattress), `report-fault` (10, 11; centred in the warning triangle, 2.5 above the base, 3.51 and 4.18 from the slanted sides), `charging-time` (15, 14; over the clock's bottom-right rim with an overlay cut-out, 2.01 from the cut ends, 3.0 from the hour hand), `charging-power-level` (10, 15; below the gauge's pivot, its top tip 2.14 from the pivot), `route-to-charger` (17, 2.5; top right, the route ends 2.31 before its lower tip), `fuel-station-charging` (10, 11; centred in the pillar under the canopy, 2.0 from both pillar walls, 3.0 below the pillar top), `dealer-charging` (15.5, 3.5; over the building's top-right roof corner with an overlay cut-out: the roof ends 2.06 left of the bolt, the right wall ends 2.15 below it), `shop-charging` (10, 8.25; centred in the cart's basket, 2.75 below the rim and 2.75 above the bottom, 4.70 and 4.92 from the slanted sides), `streetlight-charging` (4.5, 10.5; on the mast, centred on its axis, with an overlay cut-out of the mast: the cut ends 2.14 above and 2.02 below the bolt), `charging-hub` (10, 10; centred in the middle pillar, 2.0 from both pillar walls, 4.5 below the pillar top, 5.0 above the ground line), `highway-charging` (10, 1.75; centred above the bridge deck, its lower tip 2.5 above the deck, its top tip on the edge of the live area), `accessible-charging` (17, 3; top right of the wheelchair user, 6.1 from the knee, 8.5 from the wheel), `free-charging` (16.5, 13.5; over the tag's lower-right edge with an overlay cut-out: the edge ends 2.04 below the bolt, the arc of the right corner ends 2.02 above its top tip; 4.27 from the digit 0), `idle-fee` (14.25, 12.75; right of the parking meter's pole, 2.25 from the pole and from the foot line, 2.62 from the head), `qr-charging` (16.25, 14.5; in the place of the missing fourth finder, centred under the top-right finder at x 18.25, its lower tip flush with the bottom of the lower finder at y 21; 6.0 below the top-right finder, 7.75 right of the bottom-left finder), `truck-electric` (6.25, 7.25; centred in the cargo box, 3.75 from both box walls, 2.25 from the box top, 2.32 from the rear wheel below it), `bus-electric` (10, 7.5; across the window line, which is cut out around it with its cut ends 2.0 from the bolt, like `car-electric`; 2.0 below the roof and 2.0 above the bottom line), `bike-electric` (10.25, 1.75; above the frame between the saddle and the handlebar, its lower tip in the open step-through: 2.02 from the saddle, 2.10 from the seat tube, 2.75 from the handlebar and stem, 3.66 from the down tube; its top tip on the edge of the live area), `charging-availability` (4.5, 8.75; centred in the free left bay, 2.0 from both bay walls, 5.25 above the bay floor; the car stadium in the occupied right bay keeps 2.0 to its walls and 4.0 to its floor, 7.0 from the bolt), `station-uptime` (10, 2; centred above the five bars, its lower tip 2.69 from the top of the middle bar and 4.10 from the second bar, its top tip 0.25 inside the live area), `restricted-access` (16.5, 11.5; right of the padlock body, 2.0 from its right wall, 1.0 below its top edge, 3.11 from its top-right fillet, 5.93 from the shackle). (Marker heads use their own, larger sign; see section 9.)
- **Torn bolt:** `power-outage` shows the two halves of the `charging-bolt` without the step strokes (`M6.75 13 13.75 2.5 12.75 10` and `M10.75 13 9.25 21.5 17.25 10`; gaps 4.0 and 4.5, edge to corner 3.6 and 3.9). It has no slash: the strike-through construction (section 7) would cut both step corners in the 2.5 band and leave four fragments.
- **Overlay cut-out:** when the small bolt (or another secondary sign) overlaps an outer contour, the contour is interrupted around it: a real gap in the stroke, not a sign drawn on top. Keep at least 2.0 between the bolt's centre lines and the cut ends of the contour (0.5 visible gap with round caps), and check 16 px.
- **Contactless waves:** two concentric quarter circles, radii 2 and 4 (centre-line spacing 2.0), radiating towards the top right: starting at `(X, Y − 2)` above their common centre `(X, Y)`: `a2 2 0 0 1 2 2m-2-4a4 4 0 0 1 4 4` (for example `M15.25 10a2 2 0 0 1 2 2m-2-4a4 4 0 0 1 4 4` for the centre (15.25, 12)). Used in `charging-card` (centre (15.25, 12), inside the card) and `card-terminal` (centre (17.25, 6.5), the terminal's top-right corner, outside the body). Three arcs (radii 1.75, 3.75, 5.75) were tried and rejected: at 16 px they merge into a striped blob.

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
- **GB/T 20234.2 AC** shares this face: the vehicle inlet has the flat side on top and the same 2-3-2 rows; the outline and contact positions are the same; the labels (and, reportedly, the contact gender, which is not visible in an outline icon) differ (inlet: top CP, CC; middle N, PE, L1; bottom L3, L2). It is covered by `plug-type-2` (tags "gb/t", "china"), not by a separate icon. The GB/T DC inlet (GB/T 20234.3) is a different face and has its own icon, `plug-gbt-dc` (below). Sources, retrieved 2026-11-02: Wikimedia Commons "File:GBT 20234 (AC).svg" (Mliu92, CC BY-SA 4.0; connector face, same geometry as the author's Type 2 drawing) and the Amphenol PCD Shenzhen catalogue "Excel|Mate CC", page 5 "Insert arrangement" (vehicle inlet).

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

### Type 1 reference geometry (from `plug-type-1`)

- Outline: circle `C = (12, 12)`, `R = 9` (as CHAdeMO), no flat edge; the latch and the keying tab are omitted (too fine).
- Contact positions from the public drawing "File:J1772 connector.svg" (Mliu92, to scale), scaled to R 9 and mirrored from the connector face to the inlet. Because the contacts of each pair have the same size, the mirror image looks the same.
- L1 and N: rings `r = 1.5` at `(15.4, 9.05)` and `(8.6, 9.05)` (inlet: N top left, L1 top right), (±0.38, −0.33) R from the centre.
- PE: ring `r = 1.5` at `(12, 16.7)`, 0.52 R below the centre.
- CP and PP: dots (zero-length paths) at `(7.35, 14.45)` and `(16.65, 14.45)` (inlet: CP lower left, PP lower right), (±0.52, +0.27) R. Dots, not small rings, so that the two contact sizes stay apart at 16 px.
- Smallest gaps (centre lines minus radii): PE ring to outline 2.8, L1/N ring to outline 3.0, signal dot to PE ring 3.67, L1 to N 3.8, signal dot to outline 3.74, signal dot to L1/N ring 4.04.

### CCS1 reference geometry (from `plug-ccs1`)

Built like CCS2: the Type 1 face on top, the CCS2 DC part below it, unchanged.

- Type 1 outline: circle `C = (12, 7.75)`, `R = 6` (spans y 1.75–13.75); latch, keying tab and the neck between the two parts are omitted.
- Contact positions from the public drawing "File:J1772 (CCS1).svg" (Mliu92, to scale; the same Type 1 positions as "File:J1772 connector.svg"), scaled to R 6 and mirrored from the connector face to the inlet: N and L1 at `(9.72, 5.77)` and `(14.28, 5.77)` (inlet: N top left, L1 top right), PE at `(12, 10.87)`, CP and PP at `(8.88, 9.37)` and `(15.12, 9.37)` (inlet: CP lower left, PP lower right).
- L1, N and PE: solid discs (two-arc paths r 0.75, as the CCS2 power contacts), for example `M8.97 5.77a.75.75 0 1 0 1.5 0 .75.75 0 1 0-1.5 0`. Rings r 1.0 would leave 1.98 and 1.88 to the outline. CP and PP: dots (zero-length paths).
- DC part: the CCS2 stadium `rect x=5.35 y=15.75 width=13.3 height=6.35 rx=3.175` with DC− and DC+ rings r 1.15 at `(8.525, 18.925)` and `(15.475, 18.925)` (inlet: DC− left, DC+ right), 2.0 below the Type 1 outline (the drawing has 0.46 R; reduced to fit the live area). The drawing's DC part is about 1.2 times the face diameter; the unchanged CCS2 part is 1.11 times.
- Smallest gaps (centre lines minus radii): Type 1 outline to DC part 2.0, DC contact to stadium 2.025, PE disc to outline 2.13, L1/N disc to outline 2.23, signal dot to outline 2.48, signal dot to PE disc 2.71, signal dot to L1/N disc 2.95, L1 to N 3.06.

### NACS reference geometry (from `plug-nacs`)

- Outline, 18 × 15.75 (x 3–21, y 4.25–20), wider at the top: arched top edge (r 29.25, tangent to the corners) from `(6.208, 4.829)` to `(17.792, 4.829)`, top corners r 4 around `(7, 8.75)` and `(17, 8.75)`, straight sides x 3 and 21 from y 8.75 to 11.5, elliptical bottom (radii 9 × 8.5 around `(12, 11.5)`): `M6.208 4.829a29.25 29.25 0 0 1 11.584 0A4 4 0 0 1 21 8.75v2.75a9 8.5 0 0 1-18 0V8.75a4 4 0 0 1 3.208-3.921`. Latch slot, keying tab and the housing pockets are omitted.
- Contact positions from the inlet figure of the Tesla NACS specification TS-0023666 (2022), section 5.1.1.2 (vehicle inlet seen from the front, so no mirroring), scaled to a width of 18 and checked against Wikimedia Commons "File:NACS pinout annotated.svg" (RickyCourtney, connector face, same layout mirrored).
- HV+ and HV− (DC, and L1/L2 for AC): rings `r = 1.5` at `(7.15, 9.2)` and `(16.85, 9.2)` (inlet: HV+ top left, HV− top right).
- Ground: ring `r = 1.25` at `(12, 16.1)`, bottom centre, slightly above the pilot contacts as in the drawing. Its pin is smaller than the HV pins and larger than the pilot pins, so the three sizes keep their order.
- CP and PP: dots (zero-length paths) at `(8.25, 16.4)` and `(15.75, 16.4)` (inlet: CP lower left, PP lower right).
- Smallest gaps (centre lines minus radii): signal dot to outline 2.5, signal dot to Ground ring 2.51, HV ring to outline 2.65, Ground ring to outline 2.65, HV to HV 6.7.

### GB/T DC reference geometry (from `plug-gbt-dc`)

- Outline: circle `C = (12, 12)`, `R = 9`, flattened by a horizontal edge at `y = 4.25` (0.861 R above the centre; the drawing has 0.876 R, set on the quarter grid), flat edge x 7.424–16.576: `M7.424 4.25h9.152a9 9 0 1 1-9.152 0`. The flat edge is higher than the Type 2 edge (0.778 R), which sets the two faces apart together with the DC rings. **No fillets** at the ends of the flat edge (`sharp-corner`): fillets r 2 as for Type 2, or even r 0.75, run into the top contact row.
- Contact positions from the public drawing "File:GBT 20234 (DC).svg" (Mliu92, CC BY-SA 4.0, connector face; only ratios to the outline radius used), scaled to R 9 (the drawing's R is 337.5 px). The layout is mirror-symmetric, so the inlet looks the same; only the labels swap (inlet, seen from the front):
  - top row, `y = 6.4`: S−, CC2, S+ as dots at `x = 8.8`, `12`, `15.2` (drawing: (−0.356, 0, +0.356) R, 0.622 R above the centre)
  - `(12, 9.6)`: CC1 as a dot (0.267 R above the centre)
  - DC− and DC+: rings `r = 2.4` at `(7.5, 12.25)` and `(16.5, 12.25)` (drawing: r 3.47 at (±4.53, +0.32); reduced for 2.0 to the outline, centre rounded to (±4.5, +0.25))
  - PE: ring `r = 1.5` at `(12, 17.25)` (drawing: r 2.13 at (12, 17.6); reduced and moved up 0.35 for 2.25 to the outline)
  - A− and A+: dots at `(8.2, 17.6)` and `(15.8, 17.6)`, left and right of PE (drawing: ±0.422 R, 0.622 R below the centre)
- Three contact sizes keep their order: DC rings r 2.4, PE ring r 1.5, the seven signal and auxiliary contacts as dots (drawing: rings r 1.33, which would merge).
- Smallest gaps (centre lines minus radii, measured): DC ring to outline 2.09, top dots to flat edge 2.15, A dot to outline 2.23, PE ring to outline 2.25, PE ring to A dot 2.32, top corner dots to the ends of the flat edge 2.55, DC ring to CC1 2.82, DC ring to PE ring 2.83, DC ring to A dot 3.0, dot pitch in the top row 3.2, DC ring to top corner dot 3.59.

### MCS reference geometry (from `plug-mcs`)

- Outline: a triangle with the tip down, built as the hull of three circles: two corner circles `r = 5.12` around `(7.62, 8.72)` and `(16.38, 8.72)`, concentric with the DC contacts, and a tip circle `r = 3.58` around `(12, 16.84)`, concentric with PE. The top edge is the upper tangent of the corner circles (y 3.6), the sides are the outer tangents from corner circle to tip circle (tangent points `(20.417, 11.869)`, `(14.823, 19.042)` and mirrored): `M7.62 3.6h8.76a5.12 5.12 0 0 1 4.037 8.269l-5.594 7.173a3.58 3.58 0 0 1-5.646 0l-5.594-7.173A5.12 5.12 0 0 1 7.62 3.6`. It spans x 2.5–21.5 (19 wide) and y 3.6–20.42.
- Construction and positions from the public drawing "File:MCS v3.2.svg" (Mliu92, CC BY-SA 4.0, 10 px = 1 mm, 130 mm wide, marked as speculative), scaled to a width of 19 (1 mm = 0.146 units); the drawing's outline is the same three-circle hull. Checked against the CharIN pin assignment photo (EV Engineering Online, 2026-06-17, Figure 2): same contact count and arrangement. Mirror-symmetric, so the inlet looks the same; only DC+ and DC− swap (inlet: DC− left, DC+ right).
- DC− and DC+: rings `r = 2.5` at the corner circle centres (drawing: sleeve r 3.29 around a pin r 1.39; one ring in between).
- PE: ring `r = 1.5` at `(12, 16.84)` (drawing r 2.19; reduced for 2.08 to the tip circle).
- Four C contacts as dots: the middle pair at `(10.75, 12.8)` and `(13.25, 12.8)` (drawing: two pins 1.17 apart in one stadium-shaped insulator; spread to 2.5 apart, the stadium is omitted, too fine), the outer pair at `(8.78, 14.3)` and `(15.22, 14.3)` (as in the drawing).
- Smallest gaps (centre lines minus radii, measured): PE ring to tip circle 2.08, outer to middle C dot 2.48, middle C pair 2.5, PE ring to outer C dot 2.60, outer C dot to slanted side 2.60, DC ring to outline 2.62, DC ring to middle C dot 2.64, PE ring to middle C dot 2.73, DC ring to outer C dot 3.2, DC to DC 3.76.

### Schuko reference geometry (from `plug-schuko`)

Socket face seen from the front (exception above).

- Outline: circle `C = (12, 12)`, `R = 9`, standing for the 39 mm recess.
- Contact holes: solid discs `r = 0.5` (two-arc paths, section 2) at `(7.625, 12)` and `(16.375, 12)`, 8.75 apart (19 mm on 39 mm). Holes are discs, not rings; plain dots are too faint at 16 px.
- Earthing clips: `M10.75 5.75h2.5` and `M10.75 18.25h2.5`, just inside the rim, not touching it.
- Smallest gaps: clip end to outline 2.63 (clip middle 2.75), hole to outline 4.125.

### Side-view plug block (from `charging-plug`)

Reuse it wherever a plug is shown from the side (`charging-cable`, `bidirectional-charging`); the plug points right. The head is a plain rounded box: a collar line inside it closes up with the front face at 16 px, so there is none.

- Full size (`charging-plug`): head `<rect x="8.5" y="5.5" width="9" height="11" rx="2.5"/>` (9 × 11, axis at y 11), prongs `M17.5 9h4m-4 4h4` (4.0 apart, 4.0 long), strain relief `M8.5 9H7a1.25 1.25 0 0 0-1.25 1.25v1.5A1.25 1.25 0 0 0 7 13h1.5` (2.75 × 4, r 1.25); the cable leaves its left side at `(5.75, 11)` with a bend r 2.75 (`M5.75 11a2.75 2.75 0 0 0-2.75 2.75V20`). Cable to strain relief 2.75. `plug-and-charge` uses the full-size block unchanged, with the 0.8 check mark (section 7) at the bottom right outside the head.
- Small variant (`charging-cable`, about 0.73): head `<rect x="13" y="3.5" width="6.5" height="8" rx="2"/>` (axis at y 7.5), prongs `M19.5 6H22m-2.5 3H22` (3.0 apart, 2.5 long), strain relief `M13 6.25h-.75a1.25 1.25 0 0 0 0 2.5H13` (half round r 1.25); the cable leaves at `(11, 7.5)`.
- `bidirectional-charging` uses the small head with its prongs but without strain relief and cable: head `<rect x="8.75" y="8" width="6.5" height="8" rx="2"/>`, prongs `M15.25 10.5h2.5m-2.5 3h2.5`, between two arrows (top one to the right at y 5, bottom one to the left at y 19, 3.0 from the head).
- Move the block, do not rescale it beyond these two sizes. Keep at least 2.5 between the head and any cable run.

## 6. Letter set

Letters are drawn as strokes with the regular stroke width (1.5), round caps and joins. Coordinates are relative to the letter's top-left corner; to place a letter, add the origin `(X, Y)` to every coordinate.

- **Cap height:** 8 units (baseline at `Y + 8`).
- **Lone letter:** a single letter that is the main subject of an icon (for example the P in `parking-charging`) may use cap height 11: the same construction as the letter below, every coordinate scaled by 11/8 (rounded to three decimals); the stroke stays 1.5. Letters that appear in pairs (AC, DC, kW) or as a sign inside a frame (`status-reserved`) keep cap height 8. A single digit or a single letter inside a frame (sign, circle) may use cap height 6.5 when cap height 8 would not keep the 2.0 clearance to the frame. Marker signs follow section 9 instead (cap height 5.25, a lone letter up to 6.5).
- **Widths (centre line):** A = 6, C = 5.5, D = 5.5, P = 4.75, R = 5, k = 4.5, W = 8, digit 0 = 4.5.
- **Spacing:** 2 units between the boxes of two letters (the next letter starts at `X + width + 2`).
- **Crossbar of A:** at `Y + 5`, from `X + 1.13` to `X + 4.87` (on the legs).

| Letter | Path (relative to origin 0, 0) |
|---|---|
| A | `M0 8L3 0L6 8M1.13 5H4.87` |
| C | `M5.5 1.6C4.8 .6 3.9 0 2.9 0C1.2 0 0 1.8 0 4S1.2 8 2.9 8C3.9 8 4.8 7.4 5.5 6.4` |
| D | `M0 0V8H2C4.2 8 5.5 6.2 5.5 4S4.2 0 2 0Z` |
| R | `M0 8V0H2.5A2.25 2.25 0 0 1 2.5 4.5H0M2.5 4.5 5 8` |
| k | `M0 0V8M4.5 3 0 6M1.5 5 4.5 8` |
| W | `M0 0 2 8 4 0 6 8 8 0` |
| P | `M0 8V0H2.5A2.25 2.25 0 0 1 2.5 4.5H0` |
| 0 | `M2.25 0C.9 0 0 1.8 0 4s.9 4 2.25 4S4.5 6.2 4.5 4 3.6 0 2.25 0Z` |

Example: `current-ac` places A at origin `(5.25, 3.75)` and C at `(13.25, 3.75)`, which gives `m5.25 11.75 3-8 3 8m-4.87-3h3.74` and `M18.75 5.35c-.7-1-1.6-1.6-2.6-1.6-1.7 0-2.9 1.8-2.9 4s1.2 4 2.9 4c1 0 1.9-.6 2.6-1.6` after SVGO.

A and C are tested at 16 px in `current-ac`; D is tested at 16 px in `current-dc` (D at origin (5.5, 3.75), C at (13, 3.75)): readable, its counter stays open. R is used alone in `status-reserved` at origin (9.5, 8): stem from the baseline to the cap line, bowl a half circle r 2.25 from y 0 to y 4.5 (slightly above the middle, counter 4.5 between the centre lines, 3.0 visible), leg from the bowl's end at (2.5, 4.5) to (5, 8). Tested at 16 px: readable, counter open. P is the R without its leg: the same stem and the same bowl (half circle r 2.25 from y 0 to y 4.5, closing on the stem at (0, 4.5)), so P and R match when they appear in the same set. It is used in `parking-charging` at cap height 11 (see below): `M0 11V0H3.438A3.094 3.094 0 0 1 3.438 6.188H0` at origin (5.5, 6.25), which gives `M5.5 17.25v-11h3.438a3.094 3.094 0 0 1 0 6.188H5.5` after SVGO. Tested at 16 px (at device scale 1 and 2): readable, its counter (6.19 between the centre lines, 4.69 visible) stays open; at cap height 8 the counter is 4.5 between the centre lines (3.0 visible). k is a lowercase letter whose ascender reaches the cap height: stem from y 0 to y 8, arm from the x-height (4.5, 3) down to the stem at (0, 6), leg from the arm at (1.5, 5) to the baseline at (4.5, 8) (45°); the opening between arm and leg is 5.0 at x 4.5. W has four straight strokes with all three apexes at the cap line and both vertices on the baseline (stroke slope 2 : 8); its two V counters are 4.0 wide at the cap line and keep at least 2.5 between the centre lines over their upper 2.85 units. Both are used in `power-kw`: k at origin (4.75, 8) and W at (11.25, 8) (gap 2, pair 14.5 wide, centred on (12, 12)), which gives `M4.75 8v8m4.5-5-4.5 3m1.5-1 3 3` and `m11.25 8 2 8 2-8 2 8 2-8` after SVGO. Tested at 16 px (device scale 2): readable as "kW", the k's arm and leg stay apart and the W counters stay open; the smallest gap between the letters is 2.67 (k arm end to the first W stroke).

The digit 0 is an upright oval (width 4.5, height 8, closed path). It is used in `free-charging` at cap height 8, centred on (11.5, 11.5) (origin (9.25, 7.5)), which gives `M11.5 7.5c-1.35 0-2.25 1.8-2.25 4s.9 4 2.25 4 2.25-1.8 2.25-4-.9-4-2.25-4` after SVGO. The oval keeps 2.73 to the tag's slanted edges, 2.75 to the hole and 4.27 to the bolt, so the cap height 6.5 for a single digit in a frame (see above) does not apply there: an estimate with the rotated 4.5 × 8 box suggested that cap height 8 would not keep 2.0, but the oval's curved sides stay clear of the edges. Tested at 16 px (device scale 1 and 2): readable, its counter (4.5 between the centre lines, 3.0 visible) stays open.

## 7. Status icons

- Every `status-*` icon uses the same frame: `<circle cx="12" cy="12" r="9"/>`.
- The inner sign carries the meaning (hand holding a plug = available, clock = occupied, two cars one behind the other = queue, letter R = reserved, exclamation mark = faulted, crossed-out plug = out of service, question mark = unknown). Shape alone must identify the status, because the app may render all of them in the same colour.
- Keep the inner sign inside a radius of about 5.5 around the centre, so that at least 2.5 units remain to the frame.
- Check mark block (no longer used by a status icon since `status-available` became the hand with plug on 2026-10-21; reuse it wherever EVicons needs a check): `M7.75 12.5 10.5 15l5.75-6.25`. It has a short leg of 2.75 × 2.5 and a long, steep leg of 5.75 × 6.25, drawn for EVicons and not taken from Lucide. Scaled copies: `calibrated-meter` uses it at 0.8 (short leg 2.2 × 2, long leg 4.6 × 5; box 6.8 × 5), centred at x 12 below the display, `m8.6 15.75 2.2 2 4.6-5` (y 12.75–17.75, 3.25 below the display and 3.25 above the housing bottom). The 0.8 check mark is also used in `plug-and-charge`, at the bottom right outside the plug head, and in `community-verified`, at the right inside the speech bubble.
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
- `approvedBy` / `approvedOn`: `null` until the owner (Landolsi Digital) or a maintainer the owner delegated to approves the icon after an independent review of the preview; `approvedBy` holds the company name, never a person; a release (`npm run lint:icons -- --release`) requires both.

## 9. Markers

Map markers (category `marker`) are pins with a sign inside. They are drawn like every other icon (outline only, stroke 1.5, `currentColor`), but apps also render them filled.

- **Pin geometry:** a circle with one square corner. Head circle centre `(12, 12)`, `r = 9.5`; the lower-left quarter of the circle is replaced by the corner `(2.5, 21.5)`, where the tangents of the left and bottom points meet. The pin is `M2.5 21.5V12a9.5 9.5 0 1 1 9.5 9.5Z` (SVGO leaves it unchanged): from the corner up to the left point `(2.5, 12)`, the three-quarter arc over the top and the right to the bottom point `(12, 21.5)`, and back to the corner. It spans x 2.5–21.5 and y 2.5–21.5 (with the stroke 1.75–22.25, inside the live area). The shape was chosen by the owner on 2026-11-03, replacing the drop of 0.2.0 to 0.3.0: the shape of the station pins on the charge.tn map, so that the EVicons markers can take their place.
- **Pin corner:** the corner at `(2.5, 21.5)` is a deliberate sharp corner (it marks the exact point on the map), so every marker declares `sharp-corner`. Apps anchor the corner, not the bottom centre: in a box of `size` px the corner sits at `(size × 2.5 / 24, size × 21.5 / 24)` (README, "Map markers").
- **Element order is a contract:** the pin is the **first** child element of `<svg>`, exactly the standard pin path above (one closed subpath that encloses every other element). The sign follows after it and stays inside the head: the linter checks that every sign element's bounding box lies within x 5.25–18.75, y 5.25–18.75 (the bounding square of the circle `r = 6.75` around the head centre, 2.0 inside the inner edge of the head stroke); the 2.0 clearance to the outline below is checked in review, because the corners of that square reach outside the head. An icon is named `marker` or `marker-…` if and only if its category is `marker`. The linter enforces all three (`marker: first element must be the standard pin path (design guide section 9)`). Never reorder the elements of a released marker; apps rely on **the first `<path>`** being the pin. Apps select it with `path:first-of-type`, not `:first-child`: the React components render a `<title>` as the first child when `title` is set, and an SVG string may carry a `<title>` or `<desc>` too.
- **Sign:** inside the head, at least 2.0 between the sign's centre lines and the pin outline. The sign in a marker head is larger than the small-bolt block of section 2: a bolt about 10 high, hollow, with inner spacing of at least 2.0 (exact path below). The small-bolt block is for signs inside other icons, not for markers. Signs are simplified, not thinned: the stroke stays 1.5 and no exception relaxes it. Letters (`marker-ac`, `marker-dc`) use cap height 5.25 (a lone letter, `marker-reserved`, may use up to 6.5 when its clearance stays at least 2.0) and declare `letters`; `!`, `?` and `x` are signs, not letters. The hollow bolt (10 × 7, the path listed for `marker-charging` in the table below) may also be used as the main sign of a non-marker icon, centred on the icon; it is first used by `charging-session`. `plug-in-hybrid` uses it beside a fuel drop, moved to the centre (17, 12) instead of the icon's centre (`M18.25 7 13.5 12.75h2.75L15.5 17l5-5.75h-2.75Z`, box x 13.5–20.5, y 7–17), 3.0 right of the drop.
- **Sign placements** (all centred on the head centre `(12, 12)`; clearance = smallest distance between the sign's centre lines and the pin outline; inner spacing = smallest centre-line distance between parts of the sign, junctions excluded):

| Icon | Sign | Paths after the pin | Sign box | Clearance | Inner spacing |
|---|---|---|---|---|---|
| `marker-charging` | hollow bolt, 10 high, 7 wide; the `fast-charging` vertex layout, widened so that its arms stay open | `M13.25 7 8.5 12.75h2.75L10.5 17l5-5.75h-2.75Z` | x 8.5–15.5, y 7–17 | 4.35 (top tip; the lower tip is 4.5 from the bottom side) | 2.075 (lower right edge to the upper right edge; arm widths 2.32 upper, 2.22 lower; step 2.12) |
| `marker-ac` | "AC", cap height 5.25 (letters of section 6 scaled by 5.25/8), letter gap 2 | `m7.227 14.625 1.968-5.25 1.969 5.25m-3.196-1.969h2.454` and `M16.773 10.425c-.459-.656-1.05-1.05-1.706-1.05-1.115 0-1.903 1.181-1.903 2.625s.788 2.625 1.903 2.625c.656 0 1.247-.394 1.706-1.05` | x 7.227–16.773, y 9.375–14.625 | 4.48 (ends of the C; the left foot of the A is 4.73 from the left side) | 2.56 (A to C) |
| `marker-dc` | "DC", cap height 5.25, letter gap 2 | `M7.391 9.375v5.25h1.312C10.147 14.625 11 13.444 11 12s-.853-2.625-2.297-2.625Z` and `M16.609 10.425c-.459-.656-1.05-1.05-1.706-1.05C13.787 9.375 13 10.556 13 12s.787 2.625 1.903 2.625c.656 0 1.247-.394 1.706-1.05` | x 7.391–16.609, y 9.375–14.625 | 4.20 (top left corner of the D) | 2.0 (D to C) |
| `marker-available` | check mark block of section 7, moved down 0.125 | `m7.75 12.625 2.75 2.5 5.75-6.25` | x 7.75–16.25, y 8.875–15.125 | 4.22 (end of the long leg) | – (one stroke) |
| `marker-occupied` | clock: the head is the dial; hands 2.5 up and 2 right, four tick dots at radius 5 | `M12 9.5V12h2` and `M12 7h.01M17 12h.01M12 17h.01M7 12h.01` | x 7–17, y 7–17 | 4.5 (tick dots) | 2.5 (minute hand to the 12 o'clock dot; hour hand to the 3 o'clock dot 3.0) |
| `marker-faulted` | exclamation mark block of section 7, moved down 0.375 | `M12 7.125v7` and `M12 16.875h.01` | y 7.125–16.875 | 4.62 (top of the stem and the dot) | 2.75 (stem to dot) |
| `marker-out-of-service` | "x": two diagonals, 6 × 6 | `m9 9 6 6m0-6-6 6` | x 9–15, y 9–15 | 5.26 (ends) | – (crossing only) |
| `marker-unknown` | question mark block of section 7, moved down 0.375 | `M9.5 9.625a2.5 2.5 0 1 1 3.75 2.165c-.75.43-1.25.95-1.25 1.835v.5` and `M12 16.875h.01` | x 9.5–14.5, y 7.125–16.875 | 4.62 (top of the hook and the dot) | 2.75 (stem to dot) |
| `marker-reserved` | "R" of section 6, cap height 6.5 (scaled by 6.5/8 = 0.8125; a lone letter, so larger than the AC/DC pairs, kept below the 8 of `status-reserved`) | `M9.969 15.25v-6.5H12a1.828 1.828 0 0 1 0 3.656H9.969m2.031 0 2.031 2.844` | x 9.969–14.031, y 8.75–15.25 | 5.67 (top of the stem and end of the leg) | 3.66 (counter, bowl top to the closing line; stem to bowl 3.86, leg to stem at the baseline 4.06) |
| `marker-queue` | hourglass: two triangles tip to tip, 6 wide, 9 high, crossing at the head centre; one closed stroke | `M9 7.5h6l-6 9h6Z` | x 9–15, y 7.5–16.5 | 4.09 (top corners) | 2.0 between the slants from 1.8 above and below the waist outward (the crossing is the junction); each counter holds a circle of r 1.61 (3.21 between the centre lines, 1.71 visible) |

  The marker bolt is not the small-bolt block and not a scaled copy of the `fast-charging` bolt: scaled uniformly to 10 high (or widened by 1.1, as on the candidate sheet used during design) its arms are only 1.75–1.87 apart, below the 2.0 minimum. Its tips are sharp like every bolt. The letter gap stays 2 (not scaled with the cap height): a scaled gap (1.31) would put D and C closer than the 2.0 minimum. At 24 px the counter of the small A closes; "AC" stays readable from the letter shapes, and the app shows the text next to the marker. The R in `marker-reserved` uses cap height 6.5, not 5.25: alone in the head it still keeps 5.67 to the pin, and at 5.25 its counter (2.95 between the centre lines, 1.45 visible) almost closes when filled at 24 px. The hourglass in `marker-queue` is 6 × 9 rather than 5 × 8: at 5 × 8 each triangle's counter holds only a circle of r 1.39 and nearly closes when filled at 24 px. The signs kept their size when the pin changed from the drop to the circle with a corner (0.4.0): they moved down 2 with the head centre, so every clearance grew by at least 2 (in the lower-left quarter the outline is the two straight sides, farther away than the circle); the head circle is now `r = 9.5` instead of 7.5. Larger signs (letters at cap height 6.5) would fit and may follow in a later release. The clock's tick dots are zero-length paths (section 2); in filled mode they are drawn in white like the rest of the sign.
- **Filled mode (CSS only):** the SVG never contains a fill or a colour. Apps fill the first `<path>` (the pin) and draw everything else in white:

```css
.marker svg > path:first-of-type { fill: currentColor; }
.marker svg > :not(path:first-of-type) { stroke: #fff; }
```

  The rule works for inline SVG and the React components (with or without `title`), not inside a sprite `<use>` (the symbol's children are not children of the page's `<svg>`). For map libraries that take images, pre-fill the SVG string instead (README, "Map markers").

  The pin keeps its `currentColor` stroke, so a filled pin looks 0.75 larger than its outline; that is intended.
- **Check sizes:** 24, 32 and 40 px (not 16), light and dark, outline and filled. The preview shows markers in their own section and on a map mock in both modes; `npm run snap -- <out.png> <name>...` renders the same grid to a PNG.
