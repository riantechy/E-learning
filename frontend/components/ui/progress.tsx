// components/ui/progress.tsx
interface ProgressProps {
    value: number
    className?: string
  }
  
  export function Progress({ value, className = '' }: ProgressProps) {
    return (
      <div className={`progress ${className}`}>
        <div 
          className="progress-bar" 
          role="progressbar" 
          style={{ width: `${value}%` }}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {value}%
        </div>
      </div>
    )
  }