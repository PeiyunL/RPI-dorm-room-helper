// utils/mapUtils.ts

import L from 'leaflet';
import { Coordinates, CampusFacility, Room, FilterCriteria, ComparisonMetrics } from '../types/MapTypes';

/**
 * Calculate the distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate walking time based on distance
 * @returns Time in minutes
 */
export function calculateWalkingTime(distanceInMeters: number): number {
  const walkingSpeedMPS = 1.4; // Average walking speed in meters per second
  return Math.ceil(distanceInMeters / walkingSpeedMPS / 60);
}

/**
 * Find the nearest facility of a specific type
 */
export function findNearestFacility(
  from: Coordinates,
  facilities: CampusFacility[],
  type?: string
): { facility: CampusFacility; distance: number } | null {
  const filteredFacilities = type 
    ? facilities.filter(f => f.type === type)
    : facilities;

  if (filteredFacilities.length === 0) return null;

  let nearest: CampusFacility | null = null;
  let minDistance = Infinity;

  filteredFacilities.forEach(facility => {
    const distance = calculateDistance(from, {
      lat: facility.coordinates[0],
      lng: facility.coordinates[1]
    });
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = facility;
    }
  });

  return nearest ? { facility: nearest, distance: minDistance } : null;
}

/**
 * Apply filters to rooms
 */
export function filterRooms(rooms: Room[], criteria: FilterCriteria): Room[] {
  return rooms.filter(room => {
    // Room type filter
    if (criteria.roomTypes?.length && !criteria.roomTypes.includes(room.type)) {
      return false;
    }

    // Size filter
    if (criteria.minSize && room.size < criteria.minSize) return false;
    if (criteria.maxSize && room.size > criteria.maxSize) return false;

    // Floor filter
    if (criteria.floors?.length && !criteria.floors.includes(room.floor)) {
      return false;
    }

    // Price filter
    const price = criteria.priceType === 'year' 
      ? room.price.yearRate 
      : room.price.semesterRate;
    if (criteria.minPrice && price < criteria.minPrice) return false;
    if (criteria.maxPrice && price > criteria.maxPrice) return false;

    // Amenity filter
    if (criteria.requiredAmenities?.length) {
      const roomAmenityIds = room.amenities.map(a => a.id);
      const hasAllRequired = criteria.requiredAmenities.every(
        reqId => roomAmenityIds.includes(reqId)
      );
      if (!hasAllRequired) return false;
    }

    // Availability filter
    if (criteria.availableOnly && !room.available) {
      return false;
    }

    return true;
  });
}

/**
 * Calculate comparison metrics for rooms
 */
export function calculateComparisonMetrics(
  room: Room,
  dormCoordinates: Coordinates,
  facilities: CampusFacility[]
): ComparisonMetrics {
  const proximityScores: ComparisonMetrics['proximityScores'] = {};
  
  // Calculate distances to different facility types
  const facilityTypes = ['dining', 'library', 'academic', 'gym', 'health'] as const;
  
  facilityTypes.forEach(type => {
    const nearest = findNearestFacility(dormCoordinates, facilities, type);
    if (nearest) {
      proximityScores[type] = {
        nearest: nearest.facility,
        distance: nearest.distance,
        walkingTime: calculateWalkingTime(nearest.distance)
      };
    }
  });

  // Calculate pros and cons
  const pros: string[] = [];
  const cons: string[] = [];

  // Analyze proximity
  if (proximityScores.dining && proximityScores.dining.distance < 200) {
    pros.push('Very close to dining hall');
  } else if (proximityScores.dining && proximityScores.dining.distance > 500) {
    cons.push('Far from dining options');
  }

  if (proximityScores.library && proximityScores.library.distance < 300) {
    pros.push('Near library');
  }

  if (proximityScores.gym && proximityScores.gym.distance < 400) {
    pros.push('Close to fitness center');
  }

  // Analyze room features
  if (room.type === 'single') {
    pros.push('Private room');
  }

  if (room.size > 250) {
    pros.push('Spacious room');
  } else if (room.size < 150) {
    cons.push('Compact room size');
  }

  if (room.amenities.some(a => a.name === 'Air Conditioning')) {
    pros.push('Air conditioned');
  }

  if (room.floor === 1) {
    pros.push('Ground floor - easy access');
  } else if (room.floor > 4) {
    cons.push('High floor - may require elevator');
  }

  // Calculate overall score (0-100)
  let score = 50; // Base score

  // Proximity scoring (up to 30 points)
  if (proximityScores.dining) {
    score += Math.max(0, 10 - proximityScores.dining.distance / 100);
  }
  if (proximityScores.library) {
    score += Math.max(0, 10 - proximityScores.library.distance / 100);
  }
  if (proximityScores.gym) {
    score += Math.max(0, 10 - proximityScores.gym.distance / 100);
  }

  // Room quality scoring (up to 20 points)
  score += Math.min(10, room.size / 25); // Size score
  score += room.amenities.length * 2; // Amenity score

  // Normalize to 0-100
  score = Math.min(100, Math.max(0, score));

  return {
    roomId: room.id,
    dormName: room.dormName,
    roomDetails: room,
    proximityScores,
    overallScore: Math.round(score),
    pros,
    cons
  };
}

/**
 * Create custom map markers
 */
export function createCustomMarker(
  type: string,
  color: string = '#800000'
): L.DivIcon {
  const iconMap: { [key: string]: string } = {
    dormitory: '🏠',
    dining: '🍽️',
    library: '📚',
    academic: '🎓',
    gym: '💪',
    health: '🏥',
    parking: '🅿️',
    recreation: '🎮',
    'student-center': '👥',
    administrative: '🏛️',
    selected: '📍',
    user: '📍'
  };

  return L.divIcon({
    html: `
      <div style="
        background-color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid ${color};
        font-size: 16px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      ">
        ${iconMap[type] || '📍'}
      </div>
    `,
    className: `custom-marker-${type}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20]
  });
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Format walking time for display
 */
export function formatWalkingTime(minutes: number): string {
  if (minutes < 1) {
    return 'Less than 1 min';
  } else if (minutes === 1) {
    return '1 minute';
  } else if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  }
}

/**
 * Generate map bounds from coordinates
 */
export function getBoundsFromCoordinates(coordinates: Coordinates[]): L.LatLngBounds {
  if (coordinates.length === 0) {
    throw new Error('No coordinates provided');
  }

  const latlngs = coordinates.map(coord => L.latLng(coord.lat, coord.lng));
  return L.latLngBounds(latlngs);
}

/**
 * Check if a point is within a polygon
 */
export function isPointInPolygon(
  point: Coordinates,
  polygon: L.Polygon
): boolean {
  const latlng = L.latLng(point.lat, point.lng);
  return polygon.getBounds().contains(latlng);
}

/**
 * Generate heat map data from room availability
 */
export function generateHeatMapData(
  rooms: Room[],
  dormCoordinates: Map<string, Coordinates>
): { lat: number; lng: number; intensity: number }[] {
  const heatMapData: { [key: string]: { coord: Coordinates; count: number; available: number } } = {};

  rooms.forEach(room => {
    const coord = dormCoordinates.get(room.dormName);
    if (!coord) return;

    const key = `${room.dormName}`;
    if (!heatMapData[key]) {
      heatMapData[key] = {
        coord,
        count: 0,
        available: 0
      };
    }

    heatMapData[key].count++;
    if (room.available) {
      heatMapData[key].available++;
    }
  });

  return Object.values(heatMapData).map(data => ({
    lat: data.coord.lat,
    lng: data.coord.lng,
    intensity: data.available / data.count // Availability ratio
  }));
}

/**
 * Cluster nearby facilities for cleaner map display
 */
export function clusterFacilities(
  facilities: CampusFacility[],
  clusterRadius: number = 50 // meters
): (CampusFacility & { clustered?: CampusFacility[] })[] {
  const clustered: (CampusFacility & { clustered?: CampusFacility[] })[] = [];
  const processed = new Set<string>();

  facilities.forEach(facility => {
    if (processed.has(facility.id)) return;

    const cluster: CampusFacility[] = [facility];
    processed.add(facility.id);

    facilities.forEach(other => {
      if (processed.has(other.id)) return;

      const distance = calculateDistance(
        { lat: facility.coordinates[0], lng: facility.coordinates[1] },
        { lat: other.coordinates[0], lng: other.coordinates[1] }
      );

      if (distance <= clusterRadius) {
        cluster.push(other);
        processed.add(other.id);
      }
    });

    if (cluster.length > 1) {
      // Calculate center of cluster
      const avgLat = cluster.reduce((sum, f) => sum + f.coordinates[0], 0) / cluster.length;
      const avgLng = cluster.reduce((sum, f) => sum + f.coordinates[1], 0) / cluster.length;

      clustered.push({
        ...facility,
        coordinates: [avgLat, avgLng],
        clustered: cluster
      });
    } else {
      clustered.push(facility);
    }
  });

  return clustered;
}

/**
 * Export map as image
 */
export async function exportMapAsImage(map: L.Map): Promise<Blob> {
  // This would require additional libraries like leaflet-image
  // Placeholder implementation
  return new Promise((resolve) => {
    // Implementation would go here
    resolve(new Blob());
  });
}

/**
 * Save user preferences to local storage
 */
export function saveUserPreferences(preferences: any): void {
  localStorage.setItem('rpi-dorm-map-preferences', JSON.stringify(preferences));
}

/**
 * Load user preferences from local storage
 */
export function loadUserPreferences(): any {
  const saved = localStorage.getItem('rpi-dorm-map-preferences');
  return saved ? JSON.parse(saved) : null;
}
