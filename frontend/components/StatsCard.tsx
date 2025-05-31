import { ArrowUp, ArrowDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
}

export default function StatsCard({ title, value, change, trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
      <div className={`mt-2 flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {trend === 'up' ? (
          <ArrowUp className="h-4 w-4 mr-1" />
        ) : (
          <ArrowDown className="h-4 w-4 mr-1" />
        )}
        <span>{change}</span>
      </div>
    </div>
  )
}
