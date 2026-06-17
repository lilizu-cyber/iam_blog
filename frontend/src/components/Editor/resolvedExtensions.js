import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { mergeAttributes } from '@tiptap/core'
import { resolveUploadUrl } from '../../utils/apiUrl'

export const ResolvedImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'img',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        src: resolveUploadUrl(HTMLAttributes.src),
      }),
    ]
  },
})

export const ResolvedLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        href: resolveUploadUrl(HTMLAttributes.href),
      }),
      0,
    ]
  },
})
