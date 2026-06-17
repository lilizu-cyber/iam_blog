import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { insertFileLink, insertUploadedImage } from './editorCommands'
import {
  createEditorExtensions,
  SimpleEditorBubbleMenu,
  SimpleEditorDropOverlay,
  SimpleEditorStatusBar,
  SimpleEditorToolbar,
  useEditorUpload,
} from './SimpleEditor'

const RichTextEditor = forwardRef(function RichTextEditor(
  { value = '', onChange, placeholder = 'Start writing your post...' },
  ref
) {
  const lastExternalValue = useRef(value)
  const editorRef = useRef(null)
  const dragCounterRef = useRef(0)
  const [dragActive, setDragActive] = useState(false)

  const { uploadState, uploadImage, retry, dismiss, isUploading } = useEditorUpload(
    () => editorRef.current
  )

  const uploadAndInsert = useCallback(async (file, position) => {
    await uploadImage(file, position)
  }, [uploadImage])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createEditorExtensions(placeholder),
    content: value || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content simple-editor-content',
        spellcheck: 'true',
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || [])
        const imageFile = files.find((file) => file.type.startsWith('image/'))

        if (!imageFile) return false

        event.preventDefault()

        const dropPosition = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos

        uploadAndInsert(imageFile, dropPosition)
        return true
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || [])
        const imageItem = items.find((item) => item.type.startsWith('image/'))

        if (!imageItem) return false

        const file = imageItem.getAsFile()
        if (!file) return false

        event.preventDefault()
        uploadAndInsert(file)
        return true
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML()
      lastExternalValue.current = html
      onChange?.(html)
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    if (!editor) return

    const normalizedValue = value || ''
    const currentHtml = editor.getHTML()
    const editorIsEmpty = editor.isEmpty || currentHtml === '<p></p>'
    const valueChangedExternally = normalizedValue !== lastExternalValue.current

    if (valueChangedExternally && (!editor.isFocused || editorIsEmpty)) {
      if (normalizedValue !== currentHtml) {
        editor.commands.setContent(normalizedValue, false)
      }
      lastExternalValue.current = normalizedValue
    }
  }, [editor, value])

  useImperativeHandle(ref, () => ({
    insertImage: (src, alt = '') => insertUploadedImage(editor, src, alt),
    insertLink: (text, href) => insertFileLink(editor, text, href),
    focus: () => {
      editor?.commands.focus()
    },
  }), [editor])

  const handleDragEnter = (event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes('Files')) return
    dragCounterRef.current += 1
    setDragActive(true)
  }

  const handleDragLeave = () => {
    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setDragActive(false)
    }
  }

  const handleDragOver = (event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes('Files')) return
    event.preventDefault()
  }

  const handleDropZone = () => {
    // The actual upload is handled by ProseMirror's editorProps.handleDrop.
    // This wrapper handler only clears the drag overlay state.
    dragCounterRef.current = 0
    setDragActive(false)
  }

  if (!editor) {
    return (
      <div className="simple-editor min-h-[420px] animate-pulse rounded-xl border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800" />
    )
  }

  return (
    <div
      className="simple-editor rich-text-editor-wrapper overflow-hidden rounded-xl border border-gray-300 shadow-sm dark:border-gray-600"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDropZone}
    >
      <SimpleEditorToolbar
        editor={editor}
        onUploadImage={uploadAndInsert}
        isUploading={isUploading}
      />

      <div className="relative">
        <SimpleEditorBubbleMenu editor={editor} />
        <EditorContent editor={editor} />
        <SimpleEditorDropOverlay
          visible={dragActive}
          isUploading={isUploading}
          progress={uploadState.progress}
        />
      </div>

      <SimpleEditorStatusBar
        editor={editor}
        uploadState={uploadState}
        onRetry={retry}
        onDismiss={dismiss}
      />
    </div>
  )
})

export default RichTextEditor
