import React from 'react'
import FilamentItem from './FilamentItem'
import filamentSpool from '../assets/filament_spool.png'

export default function FilamentBay({ title, items }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border">

      {/* HEADER */}
      {/* <div className="flex items-center gap-3 mb-6">
        <img src={filamentSpool} className="h-10 w-10 object-contain" />
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      </div> */}

      {/* LIST */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-gray-400">No filaments found</p>
        ) : (
          items.map(item => (
            <FilamentItem key={item.id} item={item} />
          ))
        )}
      </div>

    </div>
  )
}