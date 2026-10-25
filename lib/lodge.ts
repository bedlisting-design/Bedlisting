export const LODGE_TYPES = [
  { value: "ONE_ROOM", label: "One room" },
  { value: "SELF_CON", label: "Self-con" },
  { value: "BOYS_QUARTERS", label: "Boys’ quarters" },
  { value: "HOSTEL", label: "Hostel" },
  { value: "FLAT_2_BED", label: "2-bedroom flat" },
  { value: "FLAT_3_BED", label: "3-bedroom flat" },
  { value: "FLAT_4_BED", label: "4-bedroom flat" },
] as const;

export const AMENITIES = [
  { value: "RUNNING_WATER", label: "Running water" },
  { value: "WATER_HEATER", label: "Water heater" },
  { value: "OVERHEAD_TANK", label: "Overhead tank" },
  { value: "CONSTANT_LIGHT", label: "Constant light" },
] as const;

export type LodgeTypeValue = (typeof LODGE_TYPES)[number]["value"];
export type AmenityValue = (typeof AMENITIES)[number]["value"];

export const lodgeLabel = (v?: string | null) =>
  LODGE_TYPES.find((t) => t.value === v)?.label ?? null;

export const amenityLabel = (v: string) =>
  AMENITIES.find((a) => a.value === v)?.label ?? v;

export const isLodgeType = (v?: string | null): v is LodgeTypeValue =>
  LODGE_TYPES.some((t) => t.value === v);

export const isAmenity = (v?: string | null): v is AmenityValue =>
  AMENITIES.some((a) => a.value === v);
