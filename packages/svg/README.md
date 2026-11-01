<p><a href="https://evicons.dev"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/evicons/evicons/main/brand/logo-on-dark.png"><img src="https://raw.githubusercontent.com/evicons/evicons/main/brand/logo.svg" width="320" alt="EVicons"></picture></a></p>

# @evicons/svg

Website: [evicons.dev](https://evicons.dev)

Raw SVG files, an SVG sprite and metadata for [EVicons](https://github.com/evicons/evicons), an MIT-licensed icon library for e-mobility and EV charging.

All files are generated from the sources in `icons/` of the repository. Do not edit them by hand.

## Usage

```html
<img src="node_modules/@evicons/svg/svg/<name>.svg" alt="" />
```

Icons use `currentColor` and contain no fixed colours. Inline the SVG (or use the sprite) to colour it with CSS.

Sprite:

```html
<svg width="24" height="24"><use href="sprite.svg#evicon-<name>" /></svg>
```

Map markers (`marker-*.svg`) can be drawn filled because their first `<path>` is the pin. Page CSS cannot reach into the sprite, so for filled markers inline the SVG or fill the SVG string before you use it as an image; see [Map markers](https://github.com/evicons/evicons#map-markers) in the repository README.

Metadata (names, categories, meanings, tags, aliases) is in `icons.json`:

```js
import icons from '@evicons/svg/icons.json' with { type: 'json' }
```

## License

MIT
