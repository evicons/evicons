// Server Component on purpose: no 'use client'.
import { ChargingStation, PlugType2 } from '@evicons/react'

export default function Page() {
  return (
    <main>
      <PlugType2 title="Type 2" />
      <ChargingStation className="size-4" absoluteStrokeWidth />
    </main>
  )
}
