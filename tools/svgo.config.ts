import type { Config } from 'svgo'

/**
 * SVGO configuration used both to check (lint rule 5) and to fix icon sources.
 * Shape elements are kept as-is so rect/line/polyline stay valid and editable.
 */
export const svgoConfig: Config = {
  floatPrecision: 3,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          convertShapeToPath: false,
          mergePaths: false,
        },
      },
    },
  ],
  js2svg: { pretty: true, indent: 2, finalNewline: true },
}
