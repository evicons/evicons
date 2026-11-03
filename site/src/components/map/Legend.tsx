import { MarkerCluster } from '@evicons/react'
import { currentInfo, legendStatuses, statusColour, statusInfo, type Current } from './stations'

// Static legend (rendered on the server, no JavaScript): works even when the map cannot load.
export default function Legend() {
  return (
    <section aria-labelledby="legend-heading" className="rounded-lg border border-border p-4" data-legend>
      <h2 id="legend-heading" className="text-base">
        Legend
      </h2>
      <ul className="mt-3 space-y-2 text-sm">
        {legendStatuses.map((status) => {
          const { label, icon: Icon, marker: Marker } = statusInfo[status]
          return (
            <li key={status} className="flex items-center gap-2" data-legend-entry={status}>
              <span className="flex w-14 shrink-0 items-center gap-1" style={{ color: statusColour(status) }}>
                <Icon size={20} aria-hidden="true" />
                {Marker && (
                  <span className="marker-filled inline-flex">
                    <Marker size={24} aria-hidden="true" />
                  </span>
                )}
              </span>
              <span>{label}</span>
              {!Marker && <span className="text-muted">· status icon, no marker</span>}
            </li>
          )
        })}
      </ul>
      <ul className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
        {(['ac', 'dc'] as Current[]).map((current) => {
          const { label, marker: Marker } = currentInfo[current]
          return (
            <li key={current} className="flex items-center gap-2" data-legend-current={current}>
              <span className="marker-filled inline-flex w-14 shrink-0 justify-end text-accent">
                <Marker size={24} aria-hidden="true" />
              </span>
              <span>{label} charging (badge next to the pin)</span>
            </li>
          )
        })}
      </ul>
      <ul className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
        <li className="flex items-center gap-2" data-legend-entry="cluster">
          <span className="flex w-14 shrink-0 justify-end">
            <span className="marker-filled relative inline-flex" style={{ color: 'var(--map-cluster)' }} aria-hidden="true">
              <MarkerCluster size={24} />
              {/* On the head centre, the centre of the box. */}
              <span className="absolute inset-0 flex items-center justify-center text-[10px] leading-none font-bold text-white">
                3
              </span>
            </span>
          </span>
          <span>Cluster: several charge points; the number says how many</span>
        </li>
      </ul>
    </section>
  )
}
