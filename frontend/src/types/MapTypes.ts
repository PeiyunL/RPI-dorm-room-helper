// src/types/MapTypes.ts

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CampusFacility {
  id: string;
  name: string;
  type: string; // e.g. 'dormitory' | 'dining' | 'library' | ...
  coordinates: Coordinates;
}

export interface RoomAmenity {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  building: string;
  roomNumber: string;
  floor: number;
  capacity?: number;
  amenities: RoomAmenity[];
}

export interface FilterCriteria {
  facilityTypes?: string[];
  minFloor?: number;
  maxFloor?: number;
  requiredAmenityIds?: string[];
}

export interface ComparisonMetrics {
  [key: string]: number;
}
