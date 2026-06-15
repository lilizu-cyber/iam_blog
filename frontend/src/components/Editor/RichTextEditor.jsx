import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import EditorToolbar from './EditorToolbar'

const RichTextEditor = forwardRef(function RichTextEditor(
  { value = '', onChange, placeholder = 'Start writing...' },
  ref
) {
  const hasLoadedExternalContent = useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({ inline: false }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Youtube.configure({ width: 640, height: 360 }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(currentEditor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor || !value || hasLoadedExternalContent.current) return

    if (editor.isEmpty || editor.getHTML() === '<p></p>') {
      editor.commands.setContent(value, false)
      hasLoadedExternalContent.current = true
    }
  }, [editor, value])

  useImperativeHandle(ref, () => ({
    insertImage: (src) => {
      if (!editor) return false
      editor.chain().focus().setImage({ src }).run()
      return true
    },
    insertLink: (text, href) => {
      if (!editor) return false
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text,
          marks: [{
            type: 'link',
            attrs: {
              href,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          }],
        })
        .run()
      return true
    },
    focus: () => {
      editor?.commands.focus()
    },
  }), [editor])

  if (!editor) {
    return (
      <div className="rich-text-editor-wrapper min-h-[400px] animate-pulse rounded-md border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800" />
    )
  }

  return (
    <div className="rich-text-editor-wrapper">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
})

export default RichTextEditor
