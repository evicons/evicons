const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function isKebabCase(name: string): boolean {
  return KEBAB.test(name)
}

export function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}
