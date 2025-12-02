// src/services/api.ts
import { CampusFacility, Room, FilterCriteria } from '../types/MapTypes';

// TODO: replace these with real PocketBase / API calls later

export async function fetchDormitories(): Promise<CampusFacility[]> {
  return [];
}

export async function fetchFacilities(): Promise<CampusFacility[]> {
  return [];
}

// 🔧 NOTE: accept optional FilterCriteria argument
export async function fetchRooms(
  _filters?: FilterCriteria
): Promise<Room[]> {
  // For now we ignore _filters and just return an empty list.
  // Later you can use _filters to build query params, etc.
  return [];
}
