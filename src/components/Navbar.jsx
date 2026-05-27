import React from 'react'
import SearchBar from './SearchBar'

const logoUrl = new URL('../../innomayi_image.png', import.meta.url).href

export default function Navbar({ query, setQuery }) {
  return (
    <header className="bg-[#09142d] text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={logoUrl}
            alt="Innomayi Technologies"
            className="h-32 w-auto object-contain bg-white p-5 rounded-3xl shadow-xl"
          />
        </div>

        <div className="w-full md:w-96">
          <SearchBar query={query} setQuery={setQuery} />
        </div>
      </div>
    </header>
  )
}
