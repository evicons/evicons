import { expect, test } from 'vitest'
import { haystack, normalise, searchRank } from '../src/components/gallery/util'
import { loadIcons } from '../src/lib/icons'

const icons = loadIcons()
const find = (query: string) => {
  const terms = normalise(query).trim().split(/\s+/).filter(Boolean)
  return icons
    .map((icon) => ({ name: icon.name, rank: searchRank(haystack(icon), terms) }))
    .filter(({ rank }) => rank > 0)
    .sort((a, b) => b.rank - a.rank)
    .map(({ name }) => name)
}

test('tags match at the start of a word, not inside one', () => {
  // "app" is inside the Italian "mappa" of every marker, "rij" inside the Dutch "vrij" and "bedrijf".
  const app = find('app')
  expect(app).toContain('app-charging')
  // marker-cluster stays: its meaning says that the app draws the count.
  expect(app.filter((name) => name.startsWith('marker-'))).toEqual(['marker-cluster'])
  expect(find('rij').length).toBeLessThan(5)
})

test('whole-word matches come first', () => {
  // "car" also starts the Spanish "carga" and the Italian "carica"; the cars lead the list.
  const car = find('car')
  const firstLoose = car.findIndex((name) => searchRank(haystack(icons.find((icon) => icon.name === name)!), ['car']) === 1)
  expect(firstLoose).toBeGreaterThan(0)
  for (const name of ['car-electric', 'car-plugged']) expect(car.indexOf(name), name).toBeLessThan(firstLoose)
  expect(car.indexOf('charging-station')).toBeGreaterThanOrEqual(firstLoose)
})

test('names match anywhere, in kebab or Pascal case', () => {
  expect(find('type2')).toContain('plug-type-2')
  expect(find('ccs')).toEqual(expect.arrayContaining(['plug-ccs1', 'plug-ccs2']))
})

test('every language finds the charging station, with or without diacritics', () => {
  for (const query of ['Ladesäule', 'borne de recharge', 'colonnina di ricarica', 'punto de recarga', 'laadpaal', 'stacja ładowania', 'stacja ladowania']) {
    expect(find(query), query).toContain('charging-station')
  }
})

test('several terms must all match', () => {
  expect(find('type 2')).toContain('plug-type-2')
  expect(find('type 2 zzz')).toEqual([])
})
