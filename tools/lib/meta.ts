import { KNOWN_EXCEPTIONS, isKnownException } from './exceptions.ts'
import { isKebabCase } from './names.ts'

export const CATEGORIES = ['connector', 'station', 'power', 'vehicle', 'status', 'payment', 'energy', 'marker'] as const

export type IconCategory = (typeof CATEGORIES)[number]

export type IconMeta = {
  category: IconCategory
  /** Precise meaning, e.g. to keep "broken" and "out of service" apart. */
  meaning: { en: string; de: string }
  tags: { en: string[]; de: string[]; fr: string[] }
  since: string
  aliases: string[]
  deprecated?: { since: string; replacement?: string }
  /** Required for category 'connector'. */
  standard?: { norm: string; source: string }
  exceptions?: Array<(typeof KNOWN_EXCEPTIONS)[number]>
  provenance: { createdBy: 'ai' | 'human'; approvedBy: string | null; approvedOn: string | null }
}

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z.-]+)?$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

type Obj = Record<string, unknown>

const isObject = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

function checkKeys(obj: Obj, path: string, required: string[], optional: string[], errors: string[]): void {
  for (const key of required) {
    if (!(key in obj)) errors.push(`${path}${key}: is required`)
  }
  for (const key of Object.keys(obj)) {
    if (!required.includes(key) && !optional.includes(key)) errors.push(`${path}${key}: unknown key`)
  }
}

function checkStringList(value: unknown, path: string, errors: string[], minLength: number): void {
  if (!Array.isArray(value)) {
    errors.push(`${path}: must be an array of strings`)
    return
  }
  if (value.length < minLength) errors.push(`${path}: must contain at least ${minLength} entry`)
  value.forEach((item, i) => {
    if (!isNonEmptyString(item)) errors.push(`${path}[${i}]: must be a non-empty string`)
  })
}

/** Validates raw metadata for icon `name`. Returns a list of error messages (empty when valid). */
export function validateMeta(raw: unknown, name: string): string[] {
  const errors: string[] = []
  if (!isObject(raw)) return ['metadata must be a JSON object']

  checkKeys(
    raw,
    '',
    ['category', 'meaning', 'tags', 'since', 'aliases', 'provenance'],
    ['deprecated', 'standard', 'exceptions'],
    errors,
  )

  if ('category' in raw && !(CATEGORIES as readonly unknown[]).includes(raw.category)) {
    errors.push(`category: must be one of ${CATEGORIES.join(', ')}`)
  }

  if ('meaning' in raw) {
    const meaning = raw.meaning
    if (!isObject(meaning)) {
      errors.push('meaning: must be an object with en and de')
    } else {
      checkKeys(meaning, 'meaning.', ['en', 'de'], [], errors)
      for (const lang of ['en', 'de']) {
        if (lang in meaning && !isNonEmptyString(meaning[lang])) errors.push(`meaning.${lang}: must be a non-empty string`)
      }
    }
  }

  if ('tags' in raw) {
    const tags = raw.tags
    if (!isObject(tags)) {
      errors.push('tags: must be an object with en, de and fr')
    } else {
      checkKeys(tags, 'tags.', ['en', 'de', 'fr'], [], errors)
      for (const lang of ['en', 'de', 'fr']) {
        if (lang in tags) checkStringList(tags[lang], `tags.${lang}`, errors, 1)
      }
    }
  }

  if ('since' in raw && !(typeof raw.since === 'string' && SEMVER.test(raw.since))) {
    errors.push('since: must be a SemVer version such as "0.1.0"')
  }

  if ('aliases' in raw) {
    const aliases = raw.aliases
    if (!Array.isArray(aliases)) {
      errors.push('aliases: must be an array of kebab-case names')
    } else {
      aliases.forEach((alias, i) => {
        if (typeof alias !== 'string' || !isKebabCase(alias)) errors.push(`aliases[${i}]: must be kebab-case`)
        else if (alias === name) errors.push(`aliases[${i}]: must differ from the icon name`)
      })
      if (new Set(aliases).size !== aliases.length) errors.push('aliases: must not contain duplicates')
    }
  }

  if ('deprecated' in raw) {
    const dep = raw.deprecated
    if (!isObject(dep)) {
      errors.push('deprecated: must be an object with since and optional replacement')
    } else {
      checkKeys(dep, 'deprecated.', ['since'], ['replacement'], errors)
      if ('since' in dep && !(typeof dep.since === 'string' && SEMVER.test(dep.since))) {
        errors.push('deprecated.since: must be a SemVer version')
      }
      if ('replacement' in dep && !(typeof dep.replacement === 'string' && isKebabCase(dep.replacement))) {
        errors.push('deprecated.replacement: must be a kebab-case icon name')
      }
    }
  }

  if ('standard' in raw) {
    const std = raw.standard
    if (!isObject(std)) {
      errors.push('standard: must be an object with norm and source')
    } else {
      checkKeys(std, 'standard.', ['norm', 'source'], [], errors)
      for (const key of ['norm', 'source']) {
        if (key in std && !isNonEmptyString(std[key])) errors.push(`standard.${key}: must be a non-empty string`)
      }
    }
  } else if (raw.category === 'connector') {
    errors.push('standard: is required for category "connector" (norm and source of the inlet drawing)')
  }

  if ('exceptions' in raw) {
    const exc = raw.exceptions
    if (!Array.isArray(exc)) {
      errors.push('exceptions: must be an array of exception ids')
    } else {
      exc.forEach((id, i) => {
        if (!isKnownException(id)) {
          errors.push(`exceptions[${i}]: unknown exception ${JSON.stringify(id)} (known: ${KNOWN_EXCEPTIONS.join(', ')})`)
        }
      })
    }
  }

  if ('provenance' in raw) {
    const prov = raw.provenance
    if (!isObject(prov)) {
      errors.push('provenance: must be an object with createdBy, approvedBy and approvedOn')
    } else {
      checkKeys(prov, 'provenance.', ['createdBy', 'approvedBy', 'approvedOn'], [], errors)
      if ('createdBy' in prov && prov.createdBy !== 'ai' && prov.createdBy !== 'human') {
        errors.push('provenance.createdBy: must be "ai" or "human"')
      }
      if ('approvedBy' in prov && prov.approvedBy !== null && !isNonEmptyString(prov.approvedBy)) {
        errors.push('provenance.approvedBy: must be a non-empty string or null')
      }
      if ('approvedOn' in prov && prov.approvedOn !== null && !(typeof prov.approvedOn === 'string' && ISO_DATE.test(prov.approvedOn))) {
        errors.push('provenance.approvedOn: must be a date (YYYY-MM-DD) or null')
      }
      if ((prov.approvedBy === null) !== (prov.approvedOn === null)) {
        errors.push('provenance: approvedBy and approvedOn must be set together')
      }
    }
  }

  return errors
}
