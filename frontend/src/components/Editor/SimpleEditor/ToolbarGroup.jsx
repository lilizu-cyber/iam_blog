export default function ToolbarGroup({ label, children, className = '' }) {
  return (
    <div
      className={`flex items-center gap-0.5 rounded-lg border border-gray-200/80 bg-white/70 p-0.5 dark:border-gray-600/80 dark:bg-gray-800/70 ${className}`}
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  )
}
