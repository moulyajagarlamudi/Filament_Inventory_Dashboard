import React, { useEffect, useState } from 'react'
import Home from './pages/Home'
import { fetchFilaments } from './services/googleSheet'

export default function App() {

  const [filaments, setFilaments] = useState([])

  async function loadData() {
    const data = await fetchFilaments()
    setFilaments(data)
  }

  useEffect(() => {
    loadData()

    const interval = setInterval(() => {
      loadData()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen">
      <Home filaments={filaments} />
    </div>
  )
}