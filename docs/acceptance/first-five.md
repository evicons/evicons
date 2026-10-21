# Acceptance: first five icons

Icons: `charging-station`, `plug-type-2`, `current-ac`, `status-available`, `car-plugged`.
All five are `createdBy: "ai"`, `approvedBy: null`, `since: "0.1.0"`. They may not be released until the owner has approved each one in the preview.

## Technical checks

| Check | Result |
|---|---|
| `npm run lint:icons` | ✓ 5 icons |
| `npm run build:icons` | ✓ built 5 icons |
| `npx vitest run` | 5 files, 69 tests passed |
| `npm run typecheck` | passed |

## Norm check: `plug-type-2`

The IEC 62196-2 standard itself was **not** consulted (it is paywalled). The contact layout was checked against two public drawings on Wikimedia Commons, retrieved 2026-10-21:

1. `File:Stecker-Typ 2 Belegung.svg` (public domain, de.wikipedia "Typ-2-Stecker"): Type 2 plug "bei Sicht auf die Steckkontakte", male contact face. https://commons.wikimedia.org/wiki/File:Stecker-Typ_2_Belegung.svg
2. `File:IEC 62196-2 Type 2 (plug).svg` by Mliu92 (CC BY-SA 4.0): "End view of (female) plug of the Mennekes connector". https://commons.wikimedia.org/wiki/File:IEC_62196-2_Type_2_(plug).svg

The two drawings are mirror images of each other, as expected for the male and the female face, so they confirm each other. The vehicle inlet is male, so seen from the front it matches drawing 1.

| Property | Reference (male face, drawing 1) | `plug-type-2` | Result |
|---|---|---|---|
| Contact count | 7 (5 large, 2 small) | 7 (5 × r 1.25, 2 × r 0.75) | ✓ |
| Top row (flat side) | PP left, CP right, small | PP (9.35, 7.79), CP (14.65, 7.79), small | ✓ |
| Middle row | L1 left, PE centre, N right | L1 (6.7, 11.5), PE (12, 11.5), N (17.3, 11.5) | ✓ |
| Bottom row | L2 left, L3 right | L2 (9.35, 16.106), L3 (14.65, 16.106) | ✓ |
| Outline | round, flattened on the signal-contact side | circle R 9, flat top edge at y 4.25 | ✓ |
| Row spacing | from drawing 2: top row 0.70 × pitch above the middle row, bottom row 0.87 × pitch below | 0.70 × 5.3 and 0.869 × 5.3 | ✓ |
| Outline flattening | flat top 0.733 R above the PE centre; upper sides almost straight shoulders | flat top 0.806 R above the PE centre (y 4.25 instead of about 4.9); upper sides continue the circle, fillets r 2 | deviation, documented (stylisation; the flat top is therefore weaker at 16 px, see open question M4) |

Deviations, deliberate: the contacts are drawn smaller relative to the outline than in the drawings (otherwise the 1.75 strokes would merge), and PE is drawn the same size as the other power contacts, as in both drawings. The contact labels are not part of the icon.

Open: a check against the actual standard sheet of IEC 62196-2 (vehicle inlet) is still outstanding.

## Visual self-check (16 / 20 / 24 px, light and dark, next to Lucide)

| Icon | Finding |
|---|---|
| `charging-station` | Reads as a charging station at all sizes. Spacing (stroke centre lines): bolt to window 2.0 on all four sides, window to column 2.5 (left, right, top), plug to column 2.5, column to base 2.5. At 16 px the bolt is only a small mark; window, column, cable and plug stay readable. |
| `plug-type-2` | Round inlet with flat top and seven contacts; at 16 px the contacts become dots and small and large contacts are barely distinguishable (`dense-connector`). Must be shown with the text "Type 2". |
| `current-ac` | "AC" and the sine wave are clearly readable at 16 px. |
| `status-available` | Clear at all sizes. Frame r 9 (Lucide `CircleCheck`: r 10). The check uses EVicons' own proportions (short leg 2.75 × 2.5, long leg 5.75 × 6.25). |
| `car-plugged` | Car and the plug docked at the rear read well at 20 and 24 px. At 16 px the plug and cable merge into a hook shape next to the car; the car remains recognisable. Owner decision needed. |

## Lucide similarity check (overlay)

EVicons strokes (red) were overlaid on the Lucide icons (blue, from `lucide-static`) at 360 px. They were only viewed in the browser; nothing was copied.

| EVicon | Overlaid with | Result |
|---|---|---|
| `charging-station` | `ev-charger`, `fuel` | Redrawn after the review. It shares only the archetype: an upright column on a base line. The construction differs: a closed column (rect rx 2.75) standing 2.5 above a separate base line at y 21.5, where Lucide uses an open column whose sides run into the base at y 21. A display window carries a zigzag bolt with no horizontal segment. The cable leaves the top of the column's right side, arcs over (r 2.5) and the plug hangs from it with its prongs pointing down; Lucide has a hose rising to a nozzle. No edges coincide; the base line sits at y 21.5 (Lucide: 21) and spans x 2–16.25. |
| `status-available` | `circle-check` | Circle plus check is generic. The check now has its own vectors (2.75, 2.5) and (5.75, −6.25), where Lucide uses equal 45° legs. |
| `car-plugged` | `car` | Silhouette clearly different (sloped rear, raked windshield, hood step, belt line). Shared and judged generic: wheels r 2 at cy 17 with the bottom line between them at y 17. If the car is redrawn (open questions I3/O1), consider wheels r 2.25. |
| `plug-type-2`, `current-ac` | `plug`, `zap` | No resemblance. |

## Independent review

An independent reviewer (2026-10-21) checked range `90187b0..baafada`. Spec compliance passed; quality needed fixes. The reviewer re-derived the Type 2 layout from the Commons drawings and confirmed it (male inlet face, pitch ratios 0.700 and 0.869). Findings and handling:

| Id | Finding | Handling |
|---|---|---|
| I1 | Bolt touched or overlapped the display window (gaps 0.5 to 2.0). | Fixed: taller window, new bolt; 2.0 on all four sides. The earlier "about 2.0" statement is corrected. |
| I2 | `charging-station` too close to Lucide `ev-charger`/`fuel` (base, column edge, cable exit, bolt construction). | Fixed by changing the construction (closed column, separate base, cable from the top with a hanging plug, bolt without a horizontal segment). Overlay re-checked, see above. |
| I3 | `car-plugged`: plug and cable read as "J" at 16 px. | Owner decision, see open questions. |
| M1 | Plug and window too close to the column. | Fixed: 2.5 each. |
| M2 | Check mark was Lucide's check shifted by 0.25. | Fixed: own proportions, recorded as a check block in the design guide. |
| M3 | Wheel construction shared with Lucide `car`. | Judged generic, recorded above. |
| M4 | Type 2 flat top hard to see at 16 px. | Owner decision, see open questions. |
| M5 | Car bottom corners r 1. | Fixed: r 1.25. |
| M6 | Outline deviation from the reference not recorded. | Fixed: row added to the norm table. |
| M7 | Badge stroke too faint at 12 px. | Fixed: the design guide recommends `absoluteStrokeWidth` with 1.5 (or `strokeWidth` 2). |
| O1–O3 | Car optical size, Type 2 contact sizes, generic plug on the station. | Owner decisions, see open questions. |

## Open questions for the owner

- **I3 – `car-plugged` reads as "J" at 16 px.**
  - A (reviewer's recommendation): drop the curl; the cable runs straight down from the plug and a short way left (`M4.75 15.25V20.25H2.5`), an L shape.
  - B: move the plug onto the rear flank above the wheel; the cable drops in one soft arc (plug head at y 10.5–13.5, cable `M4.75 13.5v3.5a2 2 0 0 1-2 2H2`).
  - C: reduce it to a cable stub without a plug head.
  - Whichever option is chosen, check it at 16 px.
- **O1 – `car-plugged`: the car looks smaller than Lucide `car` at 20 px.** Option: widen the body to about x 5.5–22, with the wheels around x 9 and 18.5, and shrink the plug area.
- **O2 – `plug-type-2`: the signal contacts (r 0.75) render as solid dots.**
  - Accept dots as a documented deviation from spec §6 (pins r ≈ 1–1.2), or use r 1.0?
  - Is it acceptable that power and signal contacts look alike at 16 px? If not: power r 1.5 with the pitch reduced to 5.0 (L1 x 7, N x 17), then re-check the gaps.
- **M4 – `plug-type-2`: the flat top is hard to see at 16 px.** Option: move the outline centre to (12, 12) and the flat edge to y 5, and shift the contacts by +0.5. That is closer to the reference flattening, at the cost of vertical balance (the bottom edge goes to 21.875).
- **O3 – `charging-station`: the hanging plug has two prongs (household-plug metaphor).** Keep it (clearer at 16 px), or use a rounded connector head without prongs?

## Owner approval

Pending (Task 7).
