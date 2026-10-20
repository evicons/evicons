import { describe, expect, it } from 'vitest'
import { isKebabCase, toPascalCase } from '../tools/lib/names.ts'

describe('names', () => {
  it('toPascalCase', () => {
    expect(toPascalCase('plug-type-2')).toBe('PlugType2')
    expect(toPascalCase('plug-ccs2')).toBe('PlugCcs2')
    expect(toPascalCase('status-out-of-service')).toBe('StatusOutOfService')
  })
  it('isKebabCase', () => {
    expect(isKebabCase('plug-type-2')).toBe(true)
    for (const bad of ['PlugType2', 'plug_type', 'plug--x', '-plug', 'plug-', 'Plug-type']) expect(isKebabCase(bad)).toBe(false)
  })
})
