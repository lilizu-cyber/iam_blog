import { ArrowUpTrayIcon, PhotoIcon } from '@heroicons/react/24/outline'

export default function SimpleEditorDropOverlay({ visible, isUploading, progress = 0 }) {
  if (!visible && !isUploading) return null

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center transition-all ${
        visible
          ? 'bg-primary-500/10 ring-2 ring-inset ring-primary-500/40 backdrop-blur-[1px]'
          : 'bg-transparent'
      }`}
      aria-hidden={!visible && !isUploading}
    >
      <div
        className={`flex max-w-sm flex-col items-center rounded-2xl border px-6 py-5 text-center shadow-lg transition-all ${
          visible || isUploading
            ? 'scale-100 border-primary-300 bg-white/95 opacity-100 dark:border-primary-700 dark:bg-gray-900/95'
            : 'scale-95 opacity-0'
        }`}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
          {isUploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          ) : (
            <ArrowUpTrayIcon className="h-6 w-6" />
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {isUploading ? `Uploading image... ${progress}%` : 'Drop image to upload'}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          PNG, JPG, GIF, WebP up to 10MB
        </p>
        <div className="mt-3 inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          <PhotoIcon className="h-4 w-4" />
          Stored on your blog server
        </div>
      </div>
    </div>
  )
}
