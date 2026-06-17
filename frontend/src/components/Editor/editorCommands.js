export function normalizeUrl(url) {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

export function applyLink(editor, rawUrl) {
  if (!editor) return false

  const url = rawUrl.trim()

  if (!url) {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return true
  }

  const href = normalizeUrl(url)
  const { empty, from, to } = editor.state.selection

  if (empty) {
    editor
      .chain()
      .focus()
      .insertContent(
        `<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>`
      )
      .run()
    return true
  }

  const selectedText = editor.state.doc.textBetween(from, to, ' ')

  editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href, target: '_blank', rel: 'noopener noreferrer' })
    .run()

  return editor.isActive('link') || selectedText.length > 0
}

export function insertUploadedImage(editor, src, alt = '') {
  if (!editor || !src) return false

  return editor
    .chain()
    .focus()
    .setImage({ src, alt: alt || 'Uploaded image' })
    .run()
}

export function insertFileLink(editor, text, href) {
  if (!editor || !href) return false

  const label = text || href

  return editor
    .chain()
    .focus()
    .insertContent(
      `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
    )
    .run()
}
