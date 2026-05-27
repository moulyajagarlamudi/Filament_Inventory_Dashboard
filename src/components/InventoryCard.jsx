import React from 'react'
import FilamentSpool from './FilamentSpool'

export default function InventoryCard({ item }) {

  const getFilamentColor = (name) => {
    const lower = name.toLowerCase()

    if (lower.includes('black')) return '#1e293b'
    if (lower.includes('white')) return '#e5e7eb'
    if (lower.includes('red')) return '#ef4444'
    if (lower.includes('blue')) return '#3b82f6'
    if (lower.includes('green')) return '#22c55e'
    if (lower.includes('yellow')) return '#eab308'

    return '#64748b'
  }

  const color = getFilamentColor(item.name)

  return (
    <div className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
        <FilamentSpool color={color} />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          {item.name}
        </h2>

        <p className="text-slate-500 text-sm mt-1">
          Remaining Stock
        </p>

        <p className="text-3xl font-bold text-slate-900 mt-1">
          {item.remaining}g
        </p>
      </div>

    </div>
  )
}