const UPLOAD_ENDPOINT = '/api/upload/files'
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

/**
 * Validate a file before it is sent to the server.
 * Returns an error message string, or null when the file is valid.
 */
export function validateImageFile(file) {
  if (!file) return 'No file selected'
  if (!file.type.startsWith('image/')) return 'Please choose an image file'
  if (file.size > MAX_IMAGE_SIZE) return 'Image must be smaller than 10MB'
  return null
}

/**
 * Upload a single image to the self-hosted upload endpoint.
 *
 * Uses XMLHttpRequest (not fetch) so we can report real upload progress and
 * support cancellation via an AbortSignal.
 *
 * @param {File} file
 * @param {{ onProgress?: (percent: number) => void, signal?: AbortSignal }} [options]
 * @returns {Promise<{ path: string, originalName: string, type: string }>}
 */
export function uploadEditorImage(file, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('files', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', UPLOAD_ENDPOINT)
    xhr.withCredentials = true

    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      }
    }

    xhr.onload = () => {
      let data = null
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        data = null
      }

      if (xhr.status >= 200 && xhr.status < 300 && data?.success) {
        const uploadedFile =
          data.data.files.find((item) => item.type === 'image') || data.data.files[0]

        if (!uploadedFile?.path) {
          reject(new Error('Upload succeeded but no image path was returned'))
          return
        }

        resolve(uploadedFile)
        return
      }

      reject(new Error(data?.message || `Upload failed (HTTP ${xhr.status})`))
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.ontimeout = () => reject(new Error('Upload timed out'))
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'))

    if (signal) {
      if (signal.aborted) {
        xhr.abort()
        return
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }

    xhr.send(formData)
  })
}
