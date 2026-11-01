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

1. **Draw `icons/<name>.svg`** on the 24 × 24 grid, following the [design guide](docs/design-guide.md): outline only, stroke width 1.5, round caps and joins, `currentColor`, no fills, colours, transforms, ids, classes or groups. The root element has exactly the attributes listed in the guide.
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

   - `category`: one of `connector`, `station`, `power`, `vehicle`, `status`, `payment`.
   - `meaning`: the precise meaning in English and German. Icons complement text, so say exactly what the icon stands for (for example "faulted" is not "out of service").
   - `since`: the version that first ships the icon.
   - Connector icons also need `standard: { norm, source }`; the source names the drawing the contact layout was checked against.
   - Deliberate style deviations are declared in `exceptions` (see the design guide, section 4).
   - `provenance`: `createdBy` records how the icon was created (allowed values in the schema); leave `approvedBy` and `approvedOn` as `null`.
3. **Lint:** `npm run lint:icons`. `npm run lint:icons -- --fix` normalises the SVGs with SVGO.
4. **Build:** `npm run build:icons` generates the React modules (`packages/react/src/icons/`, `packages/react/src/index.ts`) and the SVG package (`packages/svg/svg/`, `sprite.svg`, `icons.json`). Commit the generated files; CI checks that they are reproducible.
5. **Preview:** `npm run preview` writes `preview/dist/index.html`. Check the icon large and at 16, 20 and 24 px, on light and dark backgrounds, with the stroke variants, and next to the Lucide reference icons for optical size.
6. **Approval:** icons are reviewed by the maintainers and approved by the owner (Landolsi Digital) in the preview. On approval, `provenance.approvedBy` is set to the company name and `provenance.approvedOn` to the date. A release requires every icon to be approved (`npm run lint:icons -- --release`).

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

1. Set the new version in `packages/react/package.json` and `packages/svg/package.json` (both packages share one version) and run `npm install` to update the lockfile.
2. Move the `Unreleased` entries in `CHANGELOG.md` to a section `## [X.Y.Z] - YYYY-MM-DD`.
3. Check: `npm run lint:icons -- --release && npm run build && npm test`.
4. Commit, then push a tag `vX.Y.Z`. The release workflow runs all checks, publishes both packages to npm with provenance and creates the GitHub release from the changelog section.

## License

By contributing you agree that your contribution is licensed under the [MIT License](LICENSE).
