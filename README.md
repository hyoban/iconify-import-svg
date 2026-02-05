# iconify-import-svg

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

Import local SVG files into [Iconify JSON](https://iconify.design/docs/types/iconify-json.html) collections.

## Install

```bash
pnpm add -D iconify-import-svg
```

## Usage

### Import a single collection

```ts
import { importSvgCollection } from 'iconify-import-svg'

const collection = importSvgCollection({
  source: './icons',
  includeSubDirs: true, // default: true
})
```

### Import a directory tree as multiple collections

```ts
import { importSvgCollections } from 'iconify-import-svg'

const collections = importSvgCollections({
  source: './icons',
  prefix: 'custom',
})

// Example keys:
// custom-alerts
// custom-line-arrows
```

`importSvgCollections` creates one collection for each directory that directly contains `.svg` files. Key names are built from the relative directory path, joined with `-`.

### Use with `@egoist/tailwindcss-icons`

```ts
import { iconsPlugin } from '@egoist/tailwindcss-icons'
import { importSvgCollections } from 'iconify-import-svg'

export default {
  plugins: [
    iconsPlugin({
      collections: {
        ...importSvgCollections({
          source: './path/to/your/public/icons',
          prefix: 'custom',
        }),
      },
    }),
  ],
}
```

Then you can use classes like `i-custom-avatar-user`.

## What gets processed

- Cleans and validates each SVG with `@iconify/tools`
- Converts black to `currentColor`
- Removes white shapes
- Runs SVGO optimization
- Skips invalid SVGs with a warning instead of failing the entire import

## License

[MIT](./LICENSE.md) License © [Stephen Zhou](https://github.com/hyoban)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/iconify-import-svg?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/iconify-import-svg
[npm-downloads-src]: https://img.shields.io/npm/dm/iconify-import-svg?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/iconify-import-svg
[bundle-src]: https://img.shields.io/bundlephobia/minzip/iconify-import-svg?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=iconify-import-svg
[license-src]: https://img.shields.io/github/license/hyoban/iconify-import-svg.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/hyoban/iconify-import-svg/blob/main/LICENSE.md
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/iconify-import-svg
