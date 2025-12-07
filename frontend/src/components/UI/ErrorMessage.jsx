import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function ErrorMessage({ 
  message = 'Something went wrong', 
  className = '',
  showIcon = true 
}) {
  return (
    <div className={`flex items-center justify-center p-4 text-red-600 dark:text-red-400 ${className}`}>
      {showIcon && (
        <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
