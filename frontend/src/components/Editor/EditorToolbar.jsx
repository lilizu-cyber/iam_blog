import clsx from 'clsx'
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  ListBulletIcon,
  NumberedListIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon,
  LinkIcon,
  VideoCameraIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  Bars4Icon,
  TrashIcon,
} from '@heroicons/react/24/outline'

function ToolbarButton({ active, disabled, onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
        active
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
          : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <span className="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />
}

export default function EditorToolbar({ editor }) {
  if (!editor) return null

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL', previousUrl || 'https://')

    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank', rel: 'noopener noreferrer' }).run()
  }

  const addYoutubeVideo = () => {
    const url = window.prompt('Enter YouTube URL')
    if (!url) return
    editor.chain().focus().setYoutubeVideo({ src: url }).run()
  }

  return (
    <div className="editor-toolbar border-b border-gray-300 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
      <div className="flex flex-wrap items-center gap-0.5">
        <select
          className="mr-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          value={
            editor.isActive('heading', { level: 1 }) ? '1'
            : editor.isActive('heading', { level: 2 }) ? '2'
            : editor.isActive('heading', { level: 3 }) ? '3'
            : editor.isActive('heading', { level: 4 }) ? '4'
            : editor.isActive('heading', { level: 5 }) ? '5'
            : editor.isActive('heading', { level: 6 }) ? '6'
            : '0'
          }
          onChange={(event) => {
            const level = Number(event.target.value)
            if (level === 0) {
              editor.chain().focus().setParagraph().run()
              return
            }
            editor.chain().focus().toggleHeading({ level }).run()
          }}
        >
          <option value="0">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
          <option value="5">Heading 5</option>
          <option value="6">Heading 6</option>
        </select>

        <ToolbarDivider />

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

        <ToolbarDivider />

        <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600" title="Text color">
          <span>A</span>
          <input
            type="color"
            onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
            className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
        <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600" title="Highlight">
          <span>HL</span>
          <input
            type="color"
            onChange={(event) => editor.chain().focus().toggleHighlight({ color: event.target.value }).run()}
            className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>

        <ToolbarDivider />

        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <ListBulletIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <NumberedListIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <CodeBracketIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

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

        <ToolbarDivider />

        <ToolbarButton title="Insert link" active={editor.isActive('link')} onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Insert YouTube video" onClick={addYoutubeVideo}>
          <VideoCameraIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <TrashIcon className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </div>
  )
}
