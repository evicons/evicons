# @evicons/svg

Raw SVG files, an SVG sprite and metadata for [EVicons](https://evicons.dev), an MIT-licensed icon library for e-mobility and EV charging.

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

Metadata (names, categories, meanings, tags, aliases) is in `icons.json`:

```js
import icons from '@evicons/svg/icons.json' with { type: 'json' }
```

## License

MIT
