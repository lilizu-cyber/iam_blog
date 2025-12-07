import { motion } from 'framer-motion'

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

export default function LoadingSpinner({ size = 'md', className = '' }) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} spinner`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  )
}
