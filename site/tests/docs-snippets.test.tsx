// Every ```tsx block in the docs is a working example: it is written to a module, imported against the workspace
// packages and rendered with react-dom/server. A snippet that only lists JSX lines is wrapped in a component;
// a snippet that exports components renders each of them.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createElement, type ComponentType } from 'react'
import { renderToString } from 'react-dom/server'
import { transformSync } from 'esbuild'
import { describe, expect, it } from 'vitest'

const docs = join(import.meta.dirname, '../src/content/docs')
// Inside the repository, so that `@evicons/react` resolves to the workspace package.
const out = join(import.meta.dirname, '../../.tmp-tests/docs-snippets')

/** Props for exported example components that need them. */
const exampleProps: Record<string, Record<string, unknown>> = {
  StatusLabel: { value: 'queue' },
  ClusterPin: { count: 12 },
}

interface Block {
  file: string
  index: number
  lang: string
  code: string
}

function blocks(): Block[] {
  const found: Block[] = []
  for (const file of readdirSync(docs).filter((name) => name.endsWith('.mdx')).sort()) {
    const source = readFileSync(join(docs, file), 'utf8')
    let index = 0
    for (const match of source.matchAll(/^```(\w+)\n([\s\S]*?)^```$/gm)) {
      found.push({ file, index: index++, lang: match[1]!, code: match[2]! })
    }
  }
  return found
}

const IMPORT = /^import\b[^;]*?\bfrom\s*(['"])[^'"]+\1;?[ \t]*$/gm

/** A JSX-lines snippet as a module: imports on top, the lines (without trailing // comments) in a fragment. */
function asModule(code: string): string {
  if (/^export\s/m.test(code)) return code
  const imports = code.match(IMPORT) ?? []
  const body = code
    .replace(IMPORT, '')
    .split('\n')
    .map((line) => line.replace(/\s+\/\/ .*$/, ''))
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n')
    .trim()
  return `${imports.join('\n')}\n\nexport default function Snippet() {\n  return (\n    <>\n${body}\n    </>\n  )\n}\n`
}

const all = blocks()
const tsx = all.filter((block) => block.lang === 'tsx')

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

describe('docs snippets', () => {
  it('has at least 8 tsx snippets', () => {
    expect(tsx.length).toBeGreaterThanOrEqual(8)
  })

  it.each(tsx.map((block) => [`${block.file} #${block.index}`, block] as const))(
    'renders %s',
    async (_name, block) => {
      const path = join(out, `${block.file.replace(/\.mdx$/, '')}-${block.index}.tsx`)
      writeFileSync(path, asModule(block.code))
      const module = (await import(pathToFileURL(path).href)) as Record<string, unknown>
      const components = Object.entries(module).filter(
        (entry): entry is [string, ComponentType<Record<string, unknown>>] =>
          typeof entry[1] === 'function' && (entry[0] === 'default' || /^[A-Z]/.test(entry[0])),
      )
      expect(components.length, 'exported components').toBeGreaterThan(0)
      for (const [name, Component] of components) {
        const html = renderToString(createElement(Component, exampleProps[name] ?? {}))
        expect(html, name).toContain('<svg')
        expect(html, name).toContain('class="evicon evicon-')
      }
    },
  )

  it.each(all.filter((block) => block.lang === 'ts').map((block) => [`${block.file} #${block.index}`, block] as const))(
    'ts snippet %s compiles',
    (_name, block) => {
      expect(() => transformSync(block.code, { loader: 'ts', format: 'esm' })).not.toThrow()
    },
  )
})
