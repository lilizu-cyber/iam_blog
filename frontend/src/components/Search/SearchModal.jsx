import { useState, useEffect, useRef } from 'react'
import { Dialog } from '@headlessui/react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function SearchModal({ isOpen, onClose, onSearch }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setQuery('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-start justify-center p-4 pt-16">
        <Dialog.Panel className="mx-auto max-w-xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search articles..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                className="ml-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Search suggestions or recent searches could go here */}
            <div className="px-4 py-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Press Enter to search or Escape to close
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
