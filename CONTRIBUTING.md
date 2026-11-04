# Contributing to EVicons

Thanks for helping. EVicons is a small, focused set: icons for e-mobility and EV charging only. Before you draw anything, read the [design guide](docs/design-guide.md); it is binding for every icon.

## Scope

- In scope: charging infrastructure, connectors, power and charging modes, charge point status, electric vehicles, and things around charging.
- Out of scope: general UI icons (arrows, menu, search, ...); use a general icon set such as Lucide for those.
- No brand or manufacturer logos (car makers, charge point operators). Standardised connector faces are fine.

To propose a new icon, open an issue first with the name, the meaning and, for connectors, the standard, so that these can be agreed before drawing.

## Setup

You need Node.js 24 (see `.nvmrc`) and npm.

```sh
npm ci
```

## Adding an icon

Each icon is two files in `icons/`: the SVG and its metadata. Everything in `packages/` is generated from them.

1. **Draw `icons/<name>.svg`** on the 24 × 24 grid, following the [design guide](docs/design-guide.md): outline only, stroke width 1.5, round caps and joins, `currentColor`, no fills, colours, transforms, ids, classes or groups. The one fill is a lightning bolt: use one of the solid bolt paths of the guide (section 2, "Lightning bolt"), moved but not scaled, with `fill="currentColor"`, and declare `solid-sign` and `sharp-corner`. The root element has exactly the attributes listed in the guide.
2. **Write `icons/<name>.json`** with the metadata. The schema is in `tools/lib/meta.ts`:

   ```json
   {
     "category": "status",
     "meaning": { "en": "Occupied: the charge point is in use by another vehicle", "de": "Belegt: ..." },
     "tags": { "en": ["occupied", "in use"], "de": ["belegt"], "fr": ["occupé"] },
     "since": "0.2.0",
     "aliases": [],
     "provenance": { "createdBy": "human", "approvedBy": null, "approvedOn": null }
   }
   ```

   - `category`: one of `connector`, `station`, `power`, `vehicle`, `status`, `payment`, `energy`, `marker`.
   - `meaning`: the precise meaning in English and German. Icons complement text, so say exactly what the icon stands for (for example "faulted" is not "out of service").
   - `since`: the version that first ships the icon.
   - Connector icons also need `standard: { norm, source }`; the source names the drawing the contact layout was checked against.
   - Deliberate style deviations are declared in `exceptions` (see the design guide, section 4).
   - `osm` (optional): the OpenStreetMap tags the icon stands for, as a bare key (`socket:type2`, any value) or as `key=value` (`fee=no`). A tag belongs to one icon at most (the linter checks this); the build collects them in `packages/svg/osm.json`. Add a tag only when the icon shows exactly what the tag means, and use the key as written on the OSM wiki.
   - `ocpi` (optional): the OCPI values the icon stands for, as `<Object>.<field>=<VALUE>` from the Locations module of OCPI 2.2.1 or 2.3.0 (`Connector.standard=IEC_62196_T2`, `EVSE.status=AVAILABLE`; nested fields and lists joined with `.`, as in `Location.energy_mix.energy_sources.source=SOLAR`). The linter accepts only the fields and values listed in `tools/lib/ocpi.ts` (copied from the spec) and checks that a value belongs to one icon at most; the build collects them in `packages/svg/ocpi.json`. Add a value only when the icon means exactly what the spec says it means.
   - Map markers have category `marker` and a name `marker-…` (the linter requires both together). Their element order is a contract: the first element is the standard pin path, `M2.5 21.5V12a9.5 9.5 0 1 1 9.5 9.5Z`, and every other element is the sign inside the pin head (design guide section 9). Apps fill the first `<path>`, so never reorder the elements of a released marker.
   - `provenance`: `createdBy` records how the icon was created (allowed values in the schema); leave `approvedBy` and `approvedOn` as `null`.
3. **Lint:** `npm run lint:icons`. `npm run lint:icons -- --fix` normalises the SVGs with SVGO.
4. **Build:** `npm run build:icons` generates the React modules (`packages/react/src/icons/`, `packages/react/src/index.ts`) and the SVG package (`packages/svg/svg/`, `sprite.svg`, `icons.json`, `osm.json`, `ocpi.json`). Commit the generated files; CI checks that they are reproducible.
5. **Preview:** `npm run preview` writes `preview/dist/index.html`. Check the icon large and at 16, 20 and 24 px, on light and dark backgrounds, with the stroke variants, and next to the Lucide reference icons for optical size. Check markers at 24, 32 and 40 px instead, outline and filled. `npm run snap -- <out.png> <name>...` renders the same review grid to a PNG.
6. **Approval:** the owner (Landolsi Digital) or a maintainer the owner delegated to approves the icon after an independent review of the preview. On approval, `provenance.approvedBy` is set to the company name and `provenance.approvedOn` to the date. A release requires every icon to be approved (`npm run lint:icons -- --release`).

## Checks

Run these before opening a pull request; CI runs the same:

```sh
npm run lint:icons
npm run build
npm test
npm run typecheck
npm run test:smoke
npm run test:consumer-next
npx playwright test
```

- `npm run build` runs `build:icons` and compiles `@evicons/react`. `test:smoke` and `test:consumer-next` test the built package, so run `build` first.
- `npx playwright test` is the visual regression test. Its reference snapshots are generated in the Docker image `mcr.microsoft.com/playwright:v<@playwright/test version>-noble` (see `playwright.config.ts`); after an intended visual change, update them in that image with `npx playwright test --update-snapshots`.

## Naming

- File names are kebab-case: `plug-type-2`. The React component name is derived from it in PascalCase: `PlugType2`.
- Name the subject, not the drawing: `status-available`, not `hand-with-plug`.
- Related icons share a prefix: `plug-*` for connectors, `status-*` for charge point status, `current-*` for AC/DC.
- Names, including aliases, must be unique after conversion to PascalCase; the linter checks this.
- Names are stable. Once released, a name is never changed or removed outside a major version (see below).

## Aliases and deprecation

- **Renaming:** give the icon its new name and add the old name to `aliases` in the metadata. `@evicons/react` then exports the component under both names, and `icons.json` lists the alias.
- **Deprecating:** add `"deprecated": { "since": "<version>", "replacement": "<new-name>" }` to the metadata (`replacement` is optional). The generated component gets a `@deprecated` JSDoc tag, so editors flag its use.
- Aliases and deprecated icons stay available at least until the next major version. They are removed only in a major release, and the removal is listed in the changelog.

## No Lucide paths

All geometry is drawn from scratch. Never copy, trace or adapt paths from Lucide or any other icon set. Lucide appears in the preview only as a visual reference for optical size and stroke weight. A test (`tests/no-lucide.test.ts`) fails if any element of an EVicons icon is identical to an element of a Lucide icon.

## Commits and changelog

- Write everything in English.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat(icons): add plug-ccs1`, `fix(react): ...`, `docs: ...`.
- Add user-facing changes to the `Unreleased` section of [CHANGELOG.md](CHANGELOG.md).

## Releasing (maintainers)

1. Set the date of the release section in `CHANGELOG.md` to the tag date: move the `Unreleased` entries to a section `## [X.Y.Z] - YYYY-MM-DD`, where the date is the day the tag is pushed. The section is copied verbatim into the GitHub release.
2. Set the new version in `packages/react/package.json` and `packages/svg/package.json` (both packages share one version) and run `npm install` to update the lockfile.
3. Check: `npm run lint:icons -- --release && npm run build && npm test`, then `npm pack --dry-run -w @evicons/react -w @evicons/svg` to review the package contents. `npm pack` and `npm publish` rebuild `@evicons/react` through its `prepack` script, and its build clears `dist/` first, so no stale modules are shipped.
4. Commit, then push a tag `vX.Y.Z`. The release workflow runs all checks, publishes both packages to npm with provenance and creates the GitHub release from the changelog section.

## License

By contributing you agree that your contribution is licensed under the [MIT License](LICENSE).
