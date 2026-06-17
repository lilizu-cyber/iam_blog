import { useCallback, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { uploadEditorImage, validateImageFile } from '../../../utils/uploadEditorFile'
import { insertUploadedImage } from '../editorCommands'

const IDLE_STATE = { status: 'idle', progress: 0, fileName: '', error: null }
const SUCCESS_RESET_MS = 2000

/**
 * Manages image uploads for the editor: progress, success, error and retry.
 *
 * @param {import('@tiptap/react').Editor | (() => import('@tiptap/react').Editor | null)} editor
 *   The editor instance, or a getter returning it (avoids stale closures).
 */
export function useEditorUpload(editor) {
  const [uploadState, setUploadState] = useState(IDLE_STATE)
  const busyRef = useRef(false)
  const lastUploadRef = useRef(null)
  const successTimerRef = useRef(null)

  const resolveEditor = useCallback(
    () => (typeof editor === 'function' ? editor() : editor),
    [editor]
  )

  const uploadImage = useCallback(
    async (file, position) => {
      const activeEditor = resolveEditor()
      const validationError = validateImageFile(file)

      if (validationError) {
        toast.error(validationError)
        return false
      }

      if (!activeEditor || busyRef.current) return false

      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current)
        successTimerRef.current = null
      }

      busyRef.current = true
      lastUploadRef.current = { file, position }
      setUploadState({ status: 'uploading', progress: 0, fileName: file.name, error: null })
      const toastId = toast.loading(`Uploading ${file.name}...`)

      try {
        const uploaded = await uploadEditorImage(file, {
          onProgress: (progress) =>
            setUploadState((current) => ({ ...current, progress })),
        })

        if (typeof position === 'number') {
          activeEditor
            .chain()
            .setTextSelection(position)
            .setImage({ src: uploaded.path, alt: uploaded.originalName || 'Uploaded image' })
            .focus()
            .run()
        } else {
          insertUploadedImage(activeEditor, uploaded.path, uploaded.originalName)
        }

        lastUploadRef.current = null
        setUploadState({ status: 'success', progress: 100, fileName: file.name, error: null })
        toast.success('Image inserted', { id: toastId })

        successTimerRef.current = window.setTimeout(() => {
          setUploadState((current) =>
            current.status === 'success' ? IDLE_STATE : current
          )
        }, SUCCESS_RESET_MS)

        return true
      } catch (error) {
        const message = error?.message || 'Failed to upload image'
        setUploadState({ status: 'error', progress: 0, fileName: file.name, error: message })
        toast.error(message, { id: toastId })
        return false
      } finally {
        busyRef.current = false
      }
    },
    [resolveEditor]
  )

  const retry = useCallback(() => {
    const last = lastUploadRef.current
    if (last) uploadImage(last.file, last.position)
  }, [uploadImage])

  const dismiss = useCallback(() => {
    lastUploadRef.current = null
    setUploadState(IDLE_STATE)
  }, [])

  return {
    uploadState,
    uploadImage,
    retry,
    dismiss,
    isUploading: uploadState.status === 'uploading',
    canRetry: uploadState.status === 'error' && lastUploadRef.current !== null,
  }
}
