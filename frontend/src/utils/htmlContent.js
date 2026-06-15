export function getPlainTextFromHtml(html) {
  if (!html || typeof html !== 'string') return ''

  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const temp = document.createElement('div')
  temp.innerHTML = html
  return (temp.textContent || temp.innerText || '').trim()
}

export function isEmptyHtml(html) {
  return getPlainTextFromHtml(html).length === 0
}
