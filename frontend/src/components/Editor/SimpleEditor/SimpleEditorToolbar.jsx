import { useRef, useState } from 'react'
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  ListBulletIcon,
  NumberedListIcon,
  CheckCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon,
  LinkIcon,
  PhotoIcon,
  VideoCameraIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  Bars4Icon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import ToolbarButton from '../ToolbarButton'
import ToolbarGroup from './ToolbarGroup'
import SimpleEditorHeadingMenu from './SimpleEditorHeadingMenu'
import SimpleEditorLinkPopover from './SimpleEditorLinkPopover'

export default function SimpleEditorToolbar({
  editor,
  onUploadImage,
  isUploading = false,
}) {
  const imageInputRef = useRef(null)
  const [linkEditorOpen, setLinkEditorOpen] = useState(false)

  if (!editor) return null

  const triggerImageUpload = () => {
    if (isUploading) return
    imageInputRef.current?.click()
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) await onUploadImage?.(file)
  }

  const addYoutubeVideo = () => {
    const url = window.prompt('Enter YouTube URL')
    if (!url) return
    editor.chain().focus().setYoutubeVideo({ src: url }).run()
  }

  return (
    <div className="simple-editor-toolbar border-b border-gray-200 bg-gray-50/95 dark:border-gray-700 dark:bg-gray-900/80">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <ToolbarGroup label="History">
          <ToolbarButton
            title="Undo"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <ArrowUturnLeftIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Redo"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <ArrowUturnRightIcon className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup label="Block type">
          <SimpleEditorHeadingMenu editor={editor} />
        </ToolbarGroup>

        <ToolbarGroup label="Formatting">
          <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <BoldIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <ItalicIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <StrikethroughIcon className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup label="Color">
          <label
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            title="Text color"
            onMouseDown={(event) => event.preventDefault()}
          >
            <span>A</span>
            <input
              type="color"
              onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
              className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
          <label
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            title="Highlight"
            onMouseDown={(event) => event.preventDefault()}
          >
            <span>HL</span>
            <input
              type="color"
              defaultValue="#fef08a"
              onChange={(event) => editor.chain().focus().toggleHighlight({ color: event.target.value }).run()}
              className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
        </ToolbarGroup>

        <ToolbarGroup label="Lists">
          <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <ListBulletIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <NumberedListIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Task list" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
            <CheckCircleIcon className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup label="Blocks">
          <ToolbarButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <CodeBracketIcon className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup label="Alignment">
          <ToolbarButton title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <Bars3BottomLeftIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <Bars3Icon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <Bars3BottomRightIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
            <Bars4Icon className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup label="Media">
          <ToolbarButton
            title="Insert or edit link"
            active={editor.isActive('link') || linkEditorOpen}
            onClick={() => setLinkEditorOpen((current) => !current)}
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Upload image"
            disabled={isUploading}
            onClick={triggerImageUpload}
          >
            {isUploading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <PhotoIcon className="h-4 w-4" />
            )}
          </ToolbarButton>
          <ToolbarButton title="Insert YouTube video" onClick={addYoutubeVideo}>
            <VideoCameraIcon className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup label="Clear">
          <ToolbarButton title="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
            <TrashIcon className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>
      </div>

      <SimpleEditorLinkPopover
        editor={editor}
        open={linkEditorOpen}
        onClose={() => setLinkEditorOpen(false)}
      />
    </div>
  )
}
