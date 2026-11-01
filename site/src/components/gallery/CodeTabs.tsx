import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

export interface Snippet {
  id: string
  label: string
  code: string
  /** Wrap long lines instead of scrolling (one-line snippets). */
  wrap?: boolean
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export default function CodeTabs({ snippets }: { snippets: Snippet[] }) {
  const [active, setActive] = useState(snippets[0]!.id)
  const [status, setStatus] = useState('')
  const base = useId()
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const current = snippets.find((snippet) => snippet.id === active) ?? snippets[0]!

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (index + step + snippets.length) % snippets.length
    setActive(snippets[next]!.id)
    tabs.current[next]?.focus()
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  async function onCopy() {
    const ok = await copy(current.code)
    clearTimeout(timer.current)
    setStatus(ok ? 'Copied' : 'Copy failed')
    timer.current = setTimeout(() => setStatus(''), 2000)
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border px-1">
        <div role="tablist" aria-label="Code" className="flex">
          {snippets.map((snippet, index) => (
            <button
              key={snippet.id}
              ref={(el) => {
                tabs.current[index] = el
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${snippet.id}`}
              aria-selected={snippet.id === current.id}
              aria-controls={`${base}-panel`}
              tabIndex={snippet.id === current.id ? 0 : -1}
              onClick={() => setActive(snippet.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className="-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-muted hover:text-fg aria-selected:border-accent aria-selected:text-fg"
            >
              {snippet.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md px-2 py-1 text-sm text-muted hover:bg-surface hover:text-fg"
          aria-label={`Copy ${current.label} code`}
        >
          {status || 'Copy'}
        </button>
      </div>
      <div
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-tab-${current.id}`}
        tabIndex={0}
        className="max-h-72 overflow-auto bg-surface"
      >
        <pre
          className={[
            'p-3 font-mono text-xs leading-relaxed text-fg',
            current.wrap ? 'whitespace-pre-wrap wrap-anywhere' : '',
          ].join(' ')}
        >
          <code>{current.code}</code>
        </pre>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {status === 'Copied' ? 'Copied to clipboard' : status}
      </span>
    </div>
  )
}
