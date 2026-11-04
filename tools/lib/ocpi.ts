/**
 * OCPI (Open Charge Point Interface) values that icons may stand for, in the `ocpi` field of their metadata.
 *
 * An entry is `<Object>.<field>=<VALUE>`: the OCPI object (`Location`, `EVSE`, `Connector`), the path of
 * the field inside it (nested classes and lists joined with `.`; a list of enums such as `facilities`
 * matches any of its elements) and one enum value as written in the spec, for example
 * `Connector.standard=IEC_62196_T2` or `Location.energy_mix.energy_sources.source=SOLAR`.
 *
 * The values below are copied from the Locations module of the spec, `mod_locations.asciidoc` in
 * github.com/ocpi/ocpi at tag `2.2.1` and at tag `v2.3.0` (retrieved 2026-11-04). Each value records the
 * first of the two versions that defines it. Only the fields EVicons maps are listed, each with its full
 * enum, so that the linter catches a misspelt value.
 */

export type OcpiVersion = '2.2.1' | '2.3.0'

const v221 = (...values: string[]) => Object.fromEntries(values.map((value) => [value, '2.2.1' as OcpiVersion]))
const v230 = (...values: string[]) => Object.fromEntries(values.map((value) => [value, '2.3.0' as OcpiVersion]))

/** Field path -> enum value -> first OCPI version (of 2.2.1 and 2.3.0) that defines it. */
export const OCPI_FIELDS: Record<string, Record<string, OcpiVersion>> = {
  // ParkingType
  'Location.parking_type': v221('ALONG_MOTORWAY', 'PARKING_GARAGE', 'PARKING_LOT', 'ON_DRIVEWAY', 'ON_STREET', 'UNDERGROUND_GARAGE'),
  // Facility
  'Location.facilities': v221(
    'HOTEL', 'RESTAURANT', 'CAFE', 'MALL', 'SUPERMARKET', 'SPORT', 'RECREATION_AREA', 'NATURE', 'MUSEUM', 'BIKE_SHARING',
    'BUS_STOP', 'TAXI_STAND', 'TRAM_STOP', 'METRO_STATION', 'TRAIN_STATION', 'AIRPORT', 'PARKING_LOT', 'CARPOOL_PARKING',
    'FUEL_STATION', 'WIFI',
  ),
  // EnergyMix.is_green_energy (boolean)
  'Location.energy_mix.is_green_energy': v221('true', 'false'),
  // EnergyMix.energy_sources[].source (EnergySourceCategory)
  'Location.energy_mix.energy_sources.source': v221('NUCLEAR', 'GENERAL_FOSSIL', 'COAL', 'GAS', 'GENERAL_GREEN', 'SOLAR', 'WIND', 'WATER'),
  // Status
  'EVSE.status': v221('AVAILABLE', 'BLOCKED', 'CHARGING', 'INOPERATIVE', 'OUTOFORDER', 'PLANNED', 'REMOVED', 'RESERVED', 'UNKNOWN'),
  // Capability
  'EVSE.capabilities': v221(
    'CHARGING_PROFILE_CAPABLE', 'CHARGING_PREFERENCES_CAPABLE', 'CHIP_CARD_SUPPORT', 'CONTACTLESS_CARD_SUPPORT',
    'CREDIT_CARD_PAYABLE', 'DEBIT_CARD_PAYABLE', 'PED_TERMINAL', 'REMOTE_START_STOP_CAPABLE', 'RESERVABLE', 'RFID_READER',
    'START_SESSION_CONNECTOR_REQUIRED', 'TOKEN_GROUP_CAPABLE', 'UNLOCK_CAPABLE',
  ),
  // ParkingRestriction
  'EVSE.parking_restrictions': {
    ...v221('EV_ONLY', 'PLUGGED', 'DISABLED', 'CUSTOMERS', 'MOTORCYCLES'),
    ...v230('EMPLOYEES', 'TAXIS', 'TENANTS'),
  },
  // ConnectorType
  'Connector.standard': {
    ...v221(
      'CHADEMO', 'CHAOJI', 'DOMESTIC_A', 'DOMESTIC_B', 'DOMESTIC_C', 'DOMESTIC_D', 'DOMESTIC_E', 'DOMESTIC_F', 'DOMESTIC_G',
      'DOMESTIC_H', 'DOMESTIC_I', 'DOMESTIC_J', 'DOMESTIC_K', 'DOMESTIC_L', 'DOMESTIC_M', 'DOMESTIC_N', 'DOMESTIC_O', 'GBT_AC',
      'GBT_DC', 'IEC_60309_2_single_16', 'IEC_60309_2_three_16', 'IEC_60309_2_three_32', 'IEC_60309_2_three_64', 'IEC_62196_T1',
      'IEC_62196_T1_COMBO', 'IEC_62196_T2', 'IEC_62196_T2_COMBO', 'IEC_62196_T3A', 'IEC_62196_T3C', 'NEMA_5_20', 'NEMA_6_30',
      'NEMA_6_50', 'NEMA_10_30', 'NEMA_10_50', 'NEMA_14_30', 'NEMA_14_50', 'PANTOGRAPH_BOTTOM_UP', 'PANTOGRAPH_TOP_DOWN',
      'TESLA_R', 'TESLA_S',
    ),
    ...v230('MCS', 'SAE_J3400'),
  },
  // ConnectorFormat
  'Connector.format': v221('SOCKET', 'CABLE'),
  // PowerType
  'Connector.power_type': v221('AC_1_PHASE', 'AC_2_PHASE', 'AC_2_PHASE_SPLIT', 'AC_3_PHASE', 'DC'),
  // ConnectorCapability (the field is new in 2.3.0)
  'Connector.capabilities': v230('ISO_15118_2_PLUG_AND_CHARGE', 'ISO_15118_20_PLUG_AND_CHARGE'),
}

/** Syntax of an `ocpi` entry: object, field path (1 to 3 parts), `=`, enum value. */
export const OCPI_VALUE = /^(Location|EVSE|Connector)(\.[a-z][a-z_]*){1,3}=[A-Za-z0-9_]+$/

/** The first OCPI version (2.2.1 or 2.3.0) that defines `entry`, or undefined for an unknown field or value. */
export function ocpiVersion(entry: string): OcpiVersion | undefined {
  const at = entry.indexOf('=')
  if (at < 0) return undefined
  const values = OCPI_FIELDS[entry.slice(0, at)]
  return values && Object.hasOwn(values, entry.slice(at + 1)) ? values[entry.slice(at + 1)] : undefined
}
