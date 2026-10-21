# Acceptance: first five icons

Icons: `charging-station`, `plug-type-2`, `current-ac`, `status-available`, `car-plugged`.
All five are `createdBy: "ai"`, `since: "0.1.0"`. The owner approved all five on 2026-10-21 after one correction round (see "Owner decisions"); `provenance.approvedBy` is `"lotfi"` and `approvedOn` is `"2026-10-21"` in each icon's metadata.

## Technical checks

| Check | Result |
|---|---|
| `npm run lint:icons` | ✓ 5 icons |
| `node tools/lint-icons.ts --release` | ✓ 5 icons (after approval) |
| `npm run build:icons` | ✓ built 5 icons |
| `npx vitest run` | 5 files, 69 tests passed |
| `npm run typecheck` | passed |

All results are from the final state after the owner's corrections (2026-10-21).

## Accessibility

- Decorative by default: every icon renders with `aria-hidden="true"` and no role (unit test `defaults`).
- With `title`, the icon gets `role="img"`, a `<title>` with a unique id as first child and `aria-labelledby` pointing to it (unit test `title labels the icon`); `aria-label` wins over `title`.
- Checked for all five real icons on 2026-10-21 with a one-off Testing Library check (`getByRole('img', { name })` with `title`): 5 of 5 passed, the accessible name is the title.
- Icons complement text: `plug-type-2` in particular must always be shown with the text "Type 2" (see below).

## Stroke width and radius

Stroke width 1.75 and the minimum corner radius 1.25 were reviewed with the preview's stroke switcher (1.5 / 1.75 / 2) and confirmed unchanged by the owner. No global change: Global Constraints, linter rule 1, the `createEvIcon` default and spec §6/§11 stay as they are.

## Norm check: `plug-type-2`

The IEC 62196-2 standard itself was **not** consulted (it is paywalled). The contact layout was checked against two public drawings on Wikimedia Commons, retrieved 2026-10-21:

1. `File:Stecker-Typ 2 Belegung.svg` (public domain, de.wikipedia "Typ-2-Stecker"): Type 2 plug "bei Sicht auf die Steckkontakte", male contact face. https://commons.wikimedia.org/wiki/File:Stecker-Typ_2_Belegung.svg
2. `File:IEC 62196-2 Type 2 (plug).svg` by Mliu92 (CC BY-SA 4.0): "End view of (female) plug of the Mennekes connector". https://commons.wikimedia.org/wiki/File:IEC_62196-2_Type_2_(plug).svg

The two drawings are mirror images of each other, as expected for the male and the female face, so they confirm each other. The vehicle inlet is male, so seen from the front it matches drawing 1.

| Property | Reference (male face, drawing 1) | `plug-type-2` | Result |
|---|---|---|---|
| Contact count | 7 (5 large, 2 small) | 7 (5 × r 1.25, 2 × r 1.0) | ✓ |
| Top row (flat side) | PP left, CP right, small | PP (9.35, 8.29), CP (14.65, 8.29), r 1.0 | ✓ |
| Middle row | L1 left, PE centre, N right | L1 (6.7, 12), PE (12, 12), N (17.3, 12) | ✓ |
| Bottom row | L2 left, L3 right | L2 (9.35, 16.606), L3 (14.65, 16.606) | ✓ |
| Outline | round, flattened on the signal-contact side | circle C (12, 12), R 9, flat top edge at y 5 | ✓ |
| Row spacing | from drawing 2: top row 0.70 × pitch above the middle row, bottom row 0.87 × pitch below | 0.70 × 5.3 and 0.869 × 5.3 | ✓ |
| Outline flattening | flat top 0.733 R above the PE centre; upper sides almost straight shoulders | flat top 0.778 R above the PE centre (y 5; before the owner decision M4: 0.806 R at y 4.25); upper sides continue the circle, fillets r 2 | small deviation, documented (stylisation) |

Row ratios re-checked after the M4/O2 change: top row 3.71 = 0.70 × 5.3 above the middle row, bottom row 4.606 = 0.869 × 5.3 below it, unchanged. Smallest gaps (centre lines minus radii): PP/CP to the flat edge 2.29, PP/CP to L1/PE/N 2.31, power contacts to the outline 2.44, power to power 2.8, signal to signal 3.3; all at or above the connector minimum of 2.0.

Deviations, deliberate: the contacts are drawn smaller relative to the outline than in the drawings (otherwise the 1.75 strokes would merge), and PE is drawn the same size as the other power contacts, as in both drawings. The contact labels are not part of the icon.

Open: a check against the actual standard sheet of IEC 62196-2 (vehicle inlet) is still outstanding.

## Visual check (16 / 20 / 24 px, light and dark, next to Lucide)

Final state, checked in the preview (`npm run preview`) with Playwright Chromium at device pixel ratio 1 and 2, plus 4× pixel zooms of the true 16/20/24 px renders.

| Icon | Finding |
|---|---|
| `charging-station` | Reads as a charging station at all sizes. The column now stands on the base (column bottom y 19.75, base y 21.75, 2.0 between the centre lines as chosen by the owner), so at 16 px it reads as a pillar on the ground rather than a floating terminal. Other spacing unchanged: bolt to window 2.0 on all four sides, window to column 2.5, plug to column 2.5. The bolt is a small mark at 16 px (accepted, N4). |
| `plug-type-2` | Round inlet with a clearly visible flat top at 16 px after moving the flat edge to y 5. At 16–24 px all seven contacts render as similar dots; the r 1.0 signal contacts show their ring hole (0.25 units) only at large sizes. Accepted by the owner: the app must show the text "Type 2" next to the icon (`dense-connector`). |
| `current-ac` | "AC" and the sine wave are clearly readable at 16 px. Unchanged. |
| `status-available` | Clear at all sizes. Frame r 9 (Lucide `CircleCheck`: r 10); own check proportions. Unchanged. |
| `car-plugged` | The car now spans x 5.5–22 (before 6.5–21.8) and matches Lucide `car` in width at 20 px. The cable runs straight down from the plug and a short way left (L shape); the curl is gone, so at 16 px the plug area no longer forms the "J" hook. At 16 px the plug head and cable stem still merge into a compact dark mark at the rear; the car remains clearly recognisable. |

## Lucide similarity check (overlay)

EVicons strokes (red) were overlaid on the Lucide icons (blue, from `lucide-static`) at 360 px. They were only viewed in the browser; nothing was copied.

| EVicon | Overlaid with | Result |
|---|---|---|
| `charging-station` | `ev-charger`, `fuel` | Redrawn after the review. It shares only the archetype: an upright column on a base line. The construction differs: a closed column (rect rx 2.75, bottom y 19.75) standing on a separate base line at y 21.75, where Lucide uses an open column whose sides run into the base at y 21. A display window carries a zigzag bolt with no horizontal segment. The cable leaves the top of the column's right side, arcs over (r 2.5) and the plug hangs from it with its prongs pointing down; Lucide has a hose rising to a nozzle. No edges coincide; the base line sits at y 21.75 (Lucide: 21) and spans x 2–16.25. |
| `status-available` | `circle-check` | Circle plus check is generic. The check now has its own vectors (2.75, 2.5) and (5.75, −6.25), where Lucide uses equal 45° legs. |
| `car-plugged` | `car` | Silhouette clearly different (sloped rear, raked windshield, hood step, belt line). After widening (O1) the wheels sit at x 9 and 18.5 (Lucide: 7 and 17), so no wheel coincides; the body was widened by its own construction (rear part moved 1 left, roof lengthened, front moved 0.187 right), not towards Lucide. Shared and judged generic: wheels r 2 at cy 17 with the bottom line between them at y 17. |
| `plug-type-2`, `current-ac` | `plug`, `zap` | No resemblance. |

## Independent review

An independent reviewer (2026-10-21) checked range `90187b0..baafada`. Spec compliance passed; quality needed fixes. The reviewer re-derived the Type 2 layout from the Commons drawings and confirmed it (male inlet face, pitch ratios 0.700 and 0.869). Findings and handling:

| Id | Finding | Handling |
|---|---|---|
| I1 | Bolt touched or overlapped the display window (gaps 0.5 to 2.0). | Fixed: taller window, new bolt; 2.0 on all four sides. The earlier "about 2.0" statement is corrected. |
| I2 | `charging-station` too close to Lucide `ev-charger`/`fuel` (base, column edge, cable exit, bolt construction). | Fixed by changing the construction (closed column, separate base, cable from the top with a hanging plug, bolt without a horizontal segment). Overlay re-checked, see above. |
| I3 | `car-plugged`: plug and cable read as "J" at 16 px. | Owner decision A, see "Owner decisions". |
| M1 | Plug and window too close to the column. | Fixed: 2.5 each. |
| M2 | Check mark was Lucide's check shifted by 0.25. | Fixed: own proportions, recorded as a check block in the design guide. |
| M3 | Wheel construction shared with Lucide `car`. | Judged generic, recorded above. |
| M4 | Type 2 flat top hard to see at 16 px. | Owner decision, see "Owner decisions". |
| M5 | Car bottom corners r 1. | Fixed: r 1.25. |
| M6 | Outline deviation from the reference not recorded. | Fixed: row added to the norm table. |
| M7 | Badge stroke too faint at 12 px. | Fixed: the design guide recommends `absoluteStrokeWidth` with 1.5 (or `strokeWidth` 2). |
| O1–O3 | Car optical size, Type 2 contact sizes, generic plug on the station. | Owner decisions, see "Owner decisions". |
| N1, N4 | Re-review: station column reads as a terminal at 16 px; bolt small. | Owner decisions, see "Owner decisions". |
| N2 | Re-review: SVGO left an empty subpath `M7.75 17z` in `car-plugged`. | Fixed: the path starts directly with the corner arc; verified in the generated React, SVG and sprite output. |
| N3 | Re-review: station plug prongs merge at 16 px (0.25 gap). | Fixed: prongs at x 18 and 20.5 (0.75 gap, 1.0 inside the plug body). |

## Better than Lucide (one concrete comparison per icon)

| EVicon | Compared with | What EVicons adds |
|---|---|---|
| `charging-station` | Lucide `ev-charger` | A display window with its own bolt, a cable leaving the column and a hanging plug, and a separate base line, instead of a column with a hose and a bolt drawn directly on the face. |
| `plug-type-2` | Lucide `plug` | The standardised Type 2 inlet face (flat top, 7 contacts in IEC 62196-2 positions, power and signal contacts sized differently) instead of a generic two-prong household plug that identifies no EV connector. |
| `current-ac` | Lucide `zap` | Says "AC" explicitly, with letters from the EVicons stroke alphabet and a sine wave, instead of a generic power bolt; Lucide has no AC/DC icon. |
| `status-available` | Lucide `circle-check` | Part of a status system: shared frame r 9 with room for six status signs that differ by shape, and a check with its own proportions, instead of a standalone circle with a check. |
| `car-plugged` | Lucide `car` | Shows the charging state: a plug docked at the rear with its cable, plus a belt line and hood step, instead of a plain car. |

## Owner decisions

Decided by Lotfi on 2026-10-21 in the preview.

| Id | Decision | Change |
|---|---|---|
| I3 | `car-plugged`: option A, no curl; the cable runs straight down from the plug, then a short way left (L shape). | Cable `M3.75 15.25v5H2` (the reviewer's `M4.75 15.25V20.25H2.5`, moved 1 left with the plug). Checked at 16 px: no "J" hook any more. |
| O1 | `car-plugged`: widen the body to about x 5.5–22, wheels around x 9 and 18.5, shrink the plug area. | Body x 5.5–21.97 (rear part 1 left, roof at y 7 from x 10.427 to 14.696, front part 0.187 right); wheels r 2 at (9, 17) and (18.5, 17); bottom line `M11 17h5.5`; belt line `M7.25 11.5h11.437`. Plug head x 2–5.5, y 12–15.25 (before x 3–6.5); the plug area shrank from x 2–6.5 to x 2–5.5. Cable to body rear 1.75, cable to rear wheel 3.25. |
| O2 | `plug-type-2`: signal contacts (CP, PP) r 1.0 so they are rings, not dots; power contacts keep r 1.25 and pitch 5.3. Contacts looking alike at 16 px is accepted; a text label is required. | PP and CP r 0.75 → 1.0. Documented in the design guide (Type 2 reference geometry) and in the visual check. The ring hole of r 1.0 is 0.25 units, so it is only visible at large sizes. |
| M4 | `plug-type-2`: make the flat top more visible: outline centre (12, 12), flat edge y 5, contacts +0.5. | Outline `M7.101 5h9.798a2 2 0 0 1 1.4.571 9 9 0 1 1-12.598 0A2 2 0 0 1 7.101 5` (fillets r 2, flattening 0.778 R); rows at y 8.29, 12, 16.606; bottom edge 21 (21.875 with the stroke). Row ratios 0.70 and 0.869 unchanged; smallest gap 2.29 (see norm check). |
| O3 | `charging-station`: keep the two-prong plug. | None. |
| N1 | `charging-station`: option (a), the column stands on the base. | Column `rect x=3.25 y=2.5 w=11.25 h=17.25 rx=2.75` (bottom 19.75), base `M2 21.75h14.25`: 2.0 between the centre lines (the value of option a). Window, bolt, cable and plug unchanged: window to column 2.5, plug to column 2.5, bolt to window 2.0. |
| N4 | `charging-station`: accept the small bolt as is. | None. |
| Spacing rule | Minimum spacing for symbols inside windows is 2.0 (0.25 visible gap): confirmed. | Recorded in the design guide, section 2. |
| Stroke / radius | Stroke width 1.75 and minimum radius 1.25 unchanged. | None (no global change). |
| I3 (2026-10-21, later) | `car-plugged`: the owner changed I3 to option B after the re-review (at 16 px the L-shaped cable and the plug still merged into a "J"-like stem, and the stem was 1.75 from the body rear). The plug docks at the rear and the cable drops in one soft arc. Approval of the final shape is pending in the v0.1 acceptance (`docs/acceptance/v0.1.md`). | Plug head `M5.594 12.75H3.25A1.25 1.25 0 0 0 2 14v.5a1.25 1.25 0 0 0 1.25 1.25H5.5` (y 12.75–15.75; the top edge ends on the body's rear corner arc), cable `M3.5 15.75v1.75A1.5 1.5 0 0 1 2 19`. The reviewer's starting point (head y 10.5–13.5, cable `M4.75 13.5v3.5a2 2 0 0 1-2 2H2`) does not fit the widened body: the head's top edge would be 1.0 from the belt line, and the cable at x 3.75 would be 1.75 from the body rear and its arc would end at x 1.75, outside the live area. Gaps now: head top edge to belt line 2.07, cable to body rear 2.0. |

## Owner approval

Approved by Lotfi on 2026-10-21: `charging-station`, `plug-type-2`, `current-ac`, `status-available`, `car-plugged`, with the decisions listed under "Owner decisions" (I3 option A, O1 wider car, O2 signal contacts r 1.0, M4 flat top at y 5, O3 keep the two-prong plug, N1 option (a), N4 accept the bolt, in-window spacing 2.0 confirmed, stroke 1.75 and radius 1.25 unchanged).
