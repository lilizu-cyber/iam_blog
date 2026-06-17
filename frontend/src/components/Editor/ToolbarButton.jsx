import clsx from 'clsx'

export default function ToolbarButton({ active, disabled, onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(event) => {
        // Keep editor selection/focus when using toolbar controls
        event.preventDefault()
      }}
      onClick={onClick}
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
