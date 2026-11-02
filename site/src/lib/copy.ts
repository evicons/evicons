// Copy buttons rendered by CopyButton.astro. A button copies its `data-copy` text, or, without it, the text of
// the code block it belongs to (`[data-snippet]`). The result is shown on the button and announced by the
// `[data-copy-status]` live region next to it.
export function wireCopyButtons(root: ParentNode = document): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>('button[data-copy-button]')) {
    if (button.dataset.copyWired) continue
    button.dataset.copyWired = 'true'
    const status = button.parentElement?.querySelector<HTMLElement>('[data-copy-status]')
    const idle = button.textContent ?? 'Copy'
    let reset: ReturnType<typeof setTimeout> | undefined
    const show = (label: string, message: string) => {
      button.textContent = label
      if (status) status.textContent = message
    }
    button.addEventListener('click', async () => {
      clearTimeout(reset)
      const text = button.dataset.copy ?? button.closest('[data-snippet]')?.querySelector('pre')?.textContent ?? ''
      try {
        await navigator.clipboard.writeText(text)
        show(button.dataset.copied ?? 'Copied', button.dataset.copiedMessage ?? 'Copied to clipboard')
      } catch {
        const failed = button.dataset.failed ?? 'Copy failed'
        show(failed, failed)
      }
      reset = setTimeout(() => show(idle, ''), 2000)
    })
  }
}
