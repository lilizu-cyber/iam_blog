import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

const HEADING_OPTIONS = [
  { label: 'Paragraph', value: 0 },
  { label: 'Heading 1', value: 1 },
  { label: 'Heading 2', value: 2 },
  { label: 'Heading 3', value: 3 },
  { label: 'Heading 4', value: 4 },
]

function getActiveHeading(editor) {
  for (const option of HEADING_OPTIONS) {
    if (option.value === 0) continue
    if (editor.isActive('heading', { level: option.value })) {
      return option
    }
  }
  return HEADING_OPTIONS[0]
}

export default function SimpleEditorHeadingMenu({ editor }) {
  if (!editor) return null

  const activeHeading = getActiveHeading(editor)

  const applyHeading = (level) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run()
      return
    }
    editor.chain().focus().toggleHeading({ level }).run()
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        className="inline-flex h-8 min-w-[7.5rem] items-center justify-between gap-1 rounded-md px-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <span>{activeHeading.label}</span>
        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-50 mt-1 w-44 origin-top-left rounded-lg border border-gray-200 bg-white py-1 shadow-lg focus:outline-none dark:border-gray-600 dark:bg-gray-800">
          {HEADING_OPTIONS.map((option) => (
            <Menu.Item key={option.value}>
              {({ active }) => (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyHeading(option.value)}
                  className={clsx(
                    'block w-full px-3 py-2 text-left text-sm',
                    active ? 'bg-gray-100 dark:bg-gray-700' : '',
                    activeHeading.value === option.value
                      ? 'font-semibold text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-200'
                  )}
                >
                  {option.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
