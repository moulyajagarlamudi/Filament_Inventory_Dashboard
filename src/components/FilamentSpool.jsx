import React from 'react'

export default function FilamentSpool({ color }) {

  return (

    <svg
      width="70"
      height="70"
      viewBox="0 0 100 100"
      fill="none"
    >

      <circle
        cx="50"
        cy="50"
        r="38"
        stroke={color}
        strokeWidth="8"
      />

      <circle
        cx="50"
        cy="50"
        r="22"
        stroke={color}
        strokeWidth="7"
        opacity="0.7"
      />

      <circle
        cx="50"
        cy="50"
        r="10"
        fill={color}
        opacity="0.5"
      />

    </svg>
  )
}