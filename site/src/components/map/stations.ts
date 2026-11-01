// Shared data and labels for the map demo (client-safe, no node: imports).
import {
  MarkerAc,
  MarkerAvailable,
  MarkerDc,
  MarkerFaulted,
  MarkerOccupied,
  MarkerOutOfService,
  MarkerUnknown,
  PlugCcs2,
  PlugChademo,
  PlugSchuko,
  PlugType2,
  StatusAvailable,
  StatusFaulted,
  StatusOccupied,
  StatusOutOfService,
  StatusQueue,
  StatusReserved,
  StatusUnknown,
  type EvIconComponent,
} from '@evicons/react'
import data from '../../data/demo-stations.json'

/** Statuses on the demo map: each has a marker. */
export type MapStatus = 'available' | 'occupied' | 'faulted' | 'out-of-service' | 'unknown'
/** All statuses with a status icon; reserved and queue have no marker. */
export type Status = MapStatus | 'reserved' | 'queue'
export type Current = 'ac' | 'dc'
export type Connector = 'Type 2' | 'CCS2' | 'CHAdeMO' | 'Schuko'

export interface Station {
  id: string
  demo: true
  name: string
  lat: number
  lng: number
  status: MapStatus
  current: Current
  connectors: Connector[]
  kW: number
}

export const stations = data as Station[]

export const mapStatuses: MapStatus[] = ['available', 'occupied', 'faulted', 'out-of-service', 'unknown']

export const statusInfo: Record<Status, { label: string; icon: EvIconComponent; marker?: EvIconComponent }> = {
  available: { label: 'Available', icon: StatusAvailable, marker: MarkerAvailable },
  occupied: { label: 'Occupied', icon: StatusOccupied, marker: MarkerOccupied },
  faulted: { label: 'Faulted', icon: StatusFaulted, marker: MarkerFaulted },
  'out-of-service': { label: 'Out of service', icon: StatusOutOfService, marker: MarkerOutOfService },
  unknown: { label: 'Unknown', icon: StatusUnknown, marker: MarkerUnknown },
  reserved: { label: 'Reserved', icon: StatusReserved },
  queue: { label: 'Queue', icon: StatusQueue },
}

/** Legend order: the seven statuses of the status icons. */
export const legendStatuses: Status[] = [...mapStatuses, 'reserved', 'queue']

export const currentInfo: Record<Current, { label: string; marker: EvIconComponent }> = {
  ac: { label: 'AC', marker: MarkerAc },
  dc: { label: 'DC', marker: MarkerDc },
}

export const connectorIcon: Record<Connector, EvIconComponent> = {
  'Type 2': PlugType2,
  CCS2: PlugCcs2,
  CHAdeMO: PlugChademo,
  Schuko: PlugSchuko,
}

/** CSS colour of a status: the `--status-*` variables from global.css. */
export const statusColour = (status: Status) => `var(--status-${status})`
