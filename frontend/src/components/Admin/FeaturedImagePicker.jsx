import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowUpTrayIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { uploadEditorImage } from '../../utils/uploadEditorFile'
import { resolveUploadUrl } from '../../utils/apiUrl'

function getFeaturedPreviewUrl(value) {
  if (!value) return null
  if (typeof value === 'string') return resolveUploadUrl(value)
  if (value.url) return resolveUploadUrl(value.url)
  return null
}

/**
 * Per-post featured image picker.
 *
 * Uploads through the self-hosted /api/upload/files endpoint and stores the
 * featured image as { url, alt, optimization } - the shape OptimizedImage and
 * the public blog pages already expect.
 *
 * @param {Object} props
 * @param {{ url?: string, alt?: string } | string | null} props.value
 * @param {string} [props.alt] - Fallback alt text (usually the post title).
 * @param {(value: Object | null) => void} props.onChange
 */
export default function FeaturedImagePicker({ value, alt = '', onChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewSrc, setPreviewSrc] = useState(null)

  useEffect(() => {
    return () => {
      if (previewSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(previewSrc)
      }
    }
  }, [previewSrc])

  const previewUrl = previewSrc || getFeaturedPreviewUrl(value)

  const handleSelect = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB')
      return
    }

    setUploading(true)
    setProgress(0)
    const toastId = toast.loading('Uploading featured image...')
    const localPreview = URL.createObjectURL(file)
    setPreviewSrc(localPreview)

    try {
      const uploaded = await uploadEditorImage(file, { onProgress: setProgress })
      onChange({
        url: uploaded.path,
        alt: alt || uploaded.originalName || 'Featured image',
      })
      URL.revokeObjectURL(localPreview)
      setPreviewSrc(resolveUploadUrl(uploaded.path))
      toast.success('Featured image set', { id: toastId })
    } catch (error) {
      URL.revokeObjectURL(localPreview)
      setPreviewSrc(null)
      toast.error(error.message || 'Failed to upload featured image', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelect}
      />

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <img
            src={previewUrl}
            alt={typeof value === 'object' ? value?.alt || alt : alt}
            className="aspect-[21/9] w-full object-cover"
            onError={() => {
              const fallback = getFeaturedPreviewUrl(value)
              if (fallback && fallback !== previewUrl) {
                setPreviewSrc(fallback)
              }
            }}
          />
          <div className="absolute right-2 top-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-md bg-black/60 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/75 disabled:opacity-50"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewSrc(null)
                onChange(null)
              }}
              disabled={uploading}
              className="inline-flex items-center gap-1 rounded-md bg-red-600/90 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-red-700 disabled:opacity-50"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-xs text-white">
                <span>Uploading...</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-150 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 text-center transition-colors hover:border-primary-400 dark:border-gray-600 dark:hover:border-primary-500 disabled:opacity-60"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
            {uploading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            ) : (
              <PhotoIcon className="h-6 w-6" />
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400">
            <ArrowUpTrayIcon className="h-4 w-4" />
            {uploading ? `Uploading... ${progress}%` : 'Upload featured image'}
          </span>
          <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            PNG, JPG, GIF, WebP up to 10MB. Shown on cards, the post hero, and social previews.
          </span>
        </button>
      )}
    </div>
  )
}
