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

Deviations, deliberate: the contacts are drawn smaller relative to the outline than in the drawings (otherwise the 1.75 strokes would merge), and PE is drawn the same size as the other power contacts, as in both drawings. The contact labels are not part of the icon.

Open: a check against the actual standard sheet of IEC 62196-2 (vehicle inlet) is still outstanding.

## Visual self-check (16 / 20 / 24 px, light and dark, next to Lucide)

| Icon | Finding |
|---|---|
| `charging-station` | Reads as a charging station at all sizes. At 16 px the bolt in the display window is only a small mark; the window, the cable and the plug with two prongs stay readable. |
| `plug-type-2` | Round inlet with flat top and seven contacts; at 16 px the contacts become dots and small and large contacts are barely distinguishable (`dense-connector`). Must be shown with the text "Type 2". |
| `current-ac` | "AC" and the sine wave are clearly readable at 16 px. |
| `status-available` | Clear at all sizes. The circle (r 9) is slightly smaller than Lucide `CircleCheck` (r 10), on purpose, to leave room for the status frame. |
| `car-plugged` | Car and the plug docked at the rear read well at 20 and 24 px. At 16 px the plug and cable merge into a hook shape next to the car; the car remains recognisable. Owner decision needed. |

## Independent review

Pending.

## Owner approval

Pending (Task 7).
