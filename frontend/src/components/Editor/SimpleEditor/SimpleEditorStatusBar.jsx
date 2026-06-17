import { ArrowPathIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

function countWords(editor) {
  const text = editor.state.doc.textContent.trim()
  return {
    words: text ? text.split(/\s+/).filter(Boolean).length : 0,
    characters: text.length,
  }
}

export default function SimpleEditorStatusBar({ editor, uploadState, onRetry, onDismiss }) {
  if (!editor) return null

  const { words, characters } = countWords(editor)
  const { status, progress, fileName, error } = uploadState

  return (
    <div className="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
      {status === 'uploading' && (
        <div className="px-4 pt-2" aria-live="polite">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="truncate">Uploading {fileName}</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-primary-500 transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {status === 'error' && (
        <div
          className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 font-semibold text-white hover:bg-red-700"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Retry
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
            aria-label="Dismiss error"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3">
          <span>{words} words</span>
          <span>{characters} characters</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'success' && (
            <span className="text-green-600 dark:text-green-400">Image inserted</span>
          )}
          <span className="hidden sm:inline">Drag, paste, or use the toolbar to add images</span>
        </div>
      </div>
    </div>
  )
}
