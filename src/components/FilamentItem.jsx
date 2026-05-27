import React from 'react'
import filamentSpool from '../assets/filament_spool.png'

export default function FilamentItem({ item }) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">

      {/* LEFT: Spool + Name */}
      <div className="flex items-center gap-4">

        <img
          src={filamentSpool}
          alt="spool"
          className="h-16 w-16 object-contain"
        />

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {item.name}
          </h2>

          <p className="text-sm text-slate-500">

          </p>
        </div>
      </div>

      {/* RIGHT: Weight */}
      <div className="text-right">
        <p className="text-sm text-slate-500">Remaining</p>
        <p className="text-3xl font-bold text-sky-600">
          {item.weight}g
        </p>
      </div>

    </div>
  )
}