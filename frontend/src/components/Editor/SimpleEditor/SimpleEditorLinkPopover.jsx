import { useEffect, useRef, useState } from 'react'
import { LinkIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { applyLink } from '../editorCommands'

export default function SimpleEditorLinkPopover({ editor, open, onClose, anchor = 'toolbar' }) {
  const [url, setUrl] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open || !editor) return
    setUrl(editor.getAttributes('link').href || '')
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [open, editor])

  if (!open || !editor) return null

  const handleApply = () => {
    applyLink(editor, url)
    onClose()
  }

  const handleRemove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    onClose()
  }

  return (
    <div
      className={
        anchor === 'bubble'
          ? 'flex w-[min(22rem,calc(100vw-2rem))] items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-600 dark:bg-gray-900'
          : 'flex flex-wrap items-center gap-2 border-t border-gray-200 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900/95'
      }
    >
      <LinkIcon className="hidden h-4 w-4 shrink-0 text-gray-400 sm:block" />
      <input
        ref={inputRef}
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://example.com"
        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none ring-primary-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            handleApply()
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
          }
        }}
      />
      <button
        type="button"
        onClick={handleApply}
        className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
      >
        Apply
      </button>
      {editor.isActive('link') && (
        <button
          type="button"
          onClick={handleRemove}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Remove
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        aria-label="Close link editor"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
