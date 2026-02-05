// Credits: https://iconify.design/docs/articles/cleaning-up-icons/#parsing-an-entire-icon-set
import type { IconSet } from '@iconify/tools'
import type { IconifyJSON } from '@iconify/types'
import fs from 'node:fs'
import path from 'node:path'
import {
  cleanupSVG,
  deOptimisePaths,
  importDirectorySync,
  isEmptyColor,
  parseColors,
  runSVGO,
} from '@iconify/tools'
import { compareColors, stringToColor } from '@iconify/utils/lib/colors'

export interface ImportSvgCollectionOptions {
  /** Absolute or relative path to the SVG directory. */
  source: string
  /**
   * Include SVG files from subdirectories.
   * @default true
   */
  includeSubDirs?: boolean
}

export interface ImportSvgCollectionsOptions {
  /** Absolute or relative path to the root directory that contains SVG folders. */
  source: string
  /**
   * Optional prefix prepended to each generated collection key.
   *
   * For example, `prefix: 'custom'` yields keys like `custom-alerts-line`.
   */
  prefix?: string
}

/**
 * Normalizes and optimizes all icons in an icon set in place.
 *
 * Invalid icons are skipped and removed from the set.
 */
function processIconSet(iconSet: IconSet): void {
  // Track icons to remove due to processing errors
  const iconsToRemove: string[] = []

  iconSet.forEachSync((name, type) => {
    if (type !== 'icon') {
      // Do not parse aliases
      return
    }

    // Get SVG instance for icon
    const svg = iconSet.toSVG(name)
    if (!svg) {
      return
    }

    try {
      // Clean up and validate icon
      // This will throw an exception if icon is invalid
      cleanupSVG(svg)

      // Change color to `currentColor`
      // Skip this step if icon has hardcoded palette
      const blackColor = stringToColor('black')!
      const whiteColor = stringToColor('white')!
      parseColors(svg, {
        defaultColor: 'currentColor',
        callback: (attr, colorStr, color) => {
          if (!color) {
            // Color cannot be parsed!
            throw new Error(`Invalid color: "${colorStr}" in attribute ${attr}`)
          }

          if (isEmptyColor(color)) {
            // Color is empty: 'none' or 'transparent'. Return as is
            return color
          }

          // Change black to 'currentColor'
          if (compareColors(color, blackColor)) {
            return 'currentColor'
          }

          // Remove shapes with white color
          if (compareColors(color, whiteColor)) {
            return 'remove'
          }

          // Icon is not monotone
          return color
        },
      })

      // Optimise
      runSVGO(svg)

      // Update paths for compatibility with old software
      deOptimisePaths(svg)

      // SVG instance is detached from icon set, so changes to
      // icon are not stored in icon set automatically.

      // Update icon in icon set
      iconSet.fromSVG(name, svg)
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`[importSvgCollection] Skipping icon "${name}": ${message}`)
      iconsToRemove.push(name)
    }
  })

  for (const name of iconsToRemove) {
    iconSet.remove(name)
  }
}

/**
 * Imports one SVG directory as a single Iconify collection.
 *
 * @param options Import options.
 * @returns A single Iconify JSON collection exported from the directory.
 *
 * @example
 * ```ts
 * import { importSvgCollection } from 'iconify-import-svg'
 *
 * const collection = importSvgCollection({
 *   source: './my-icons',
 * })
 * ```
 */
export function importSvgCollection(
  options: ImportSvgCollectionOptions,
): IconifyJSON {
  const { source, includeSubDirs = true } = options

  const iconSet = importDirectorySync(source, {
    ignoreImportErrors: 'warn',
    includeSubDirs,
  })

  processIconSet(iconSet)

  return iconSet.export()
}

/**
 * Finds all directories under `rootDir` that directly contain `.svg` files.
 */
function findSvgDirectories(rootDir: string): string[] {
  const result: string[] = []

  function traverse(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    let hasSvgFiles = false
    const subdirs: string[] = []

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.svg')) {
        hasSvgFiles = true
      }
      else if (entry.isDirectory()) {
        subdirs.push(path.join(dir, entry.name))
      }
    }

    if (hasSvgFiles) {
      result.push(dir)
    }

    // Recursively traverse subdirectories
    for (const subdir of subdirs) {
      traverse(subdir)
    }
  }

  traverse(rootDir)
  return result
}

/**
 * Imports a directory tree as multiple Iconify collections.
 *
 * Every directory that directly contains SVG files becomes one collection.
 * Returned keys are built from the relative path joined with `-`.
 *
 * @param options Import options.
 * @returns A map of collection key to Iconify JSON.
 *
 * @example
 * ```ts
 * import { importSvgCollections } from 'iconify-import-svg'
 *
 * const collections = importSvgCollections({
 *   source: './icons',
 *   prefix: 'custom',
 * })
 * // Result keys: custom-alerts, custom-arrows
 * ```
 */
export function importSvgCollections(
  options: ImportSvgCollectionsOptions,
): Record<string, IconifyJSON> {
  const { source, prefix } = options

  const svgDirs = findSvgDirectories(source)

  const collections: Record<string, IconifyJSON> = {}

  for (const dir of svgDirs) {
    const relativePath = path.relative(source, dir)
    const pathPrefix = relativePath.split(path.sep).join('-')

    const iconSet = importDirectorySync(dir, {
      ignoreImportErrors: 'warn',
      includeSubDirs: false,
    })

    processIconSet(iconSet)

    const exported = iconSet.export()

    if (Object.keys(exported.icons).length > 0) {
      collections[prefix ? `${prefix}-${pathPrefix}` : pathPrefix] = exported
    }
  }

  return collections
}
