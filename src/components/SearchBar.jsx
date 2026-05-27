import React from 'react'
import { FiSearch } from 'react-icons/fi'

export default function SearchBar({ query, setQuery }) {
  return (
    <div className="flex items-center gap-2 bg-white text-gray-800 p-2 rounded-full shadow-sm">

      <FiSearch className="text-gray-400" />

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search PLA, PETG, ABS..."
        className="w-full bg-transparent outline-none"
      />
    </div>
  )
}