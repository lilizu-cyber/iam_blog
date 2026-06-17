import { useEffect, useState } from 'react'
import { BubbleMenu } from '@tiptap/react/menus'
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import ToolbarButton from '../ToolbarButton'
import SimpleEditorLinkPopover from './SimpleEditorLinkPopover'

export default function SimpleEditorBubbleMenu({ editor }) {
  const [linkOpen, setLinkOpen] = useState(false)

  useEffect(() => {
    if (!editor) return undefined

    const closeOnEmptySelection = () => {
      if (editor.state.selection.empty) setLinkOpen(false)
    }

    editor.on('selectionUpdate', closeOnEmptySelection)
    return () => {
      editor.off('selectionUpdate', closeOnEmptySelection)
    }
  }, [editor])

  if (!editor) return null

  const shouldShow = ({ editor: activeEditor }) => {
    if (activeEditor.state.selection.empty) return false
    if (activeEditor.isActive('codeBlock')) return false
    return true
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      options={{ placement: 'top', offset: 8 }}
      className="simple-editor-bubble-menu"
    >
      {linkOpen ? (
        <SimpleEditorLinkPopover
          editor={editor}
          open
          anchor="bubble"
          onClose={() => setLinkOpen(false)}
        />
      ) : (
        <div className="flex items-center gap-0.5 rounded-xl border border-gray-200 bg-white p-1 shadow-xl dark:border-gray-600 dark:bg-gray-900">
          <ToolbarButton
            title="Bold"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <span className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <ToolbarButton
            title="Edit link"
            active={editor.isActive('link')}
            onClick={() => setLinkOpen(true)}
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}
    </BubbleMenu>
  )
}
