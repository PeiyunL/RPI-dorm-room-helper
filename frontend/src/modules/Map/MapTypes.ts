// types/MapTypes.ts

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DormitoryFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    name: string;
    building: 'dormitory';
    capacity?: number;
    yearBuilt?: number;
    renovated?: number;
    description?: string;
    image?: string;
  };
}

export interface CampusFacility {
  id: string;
  name: string;
  type: FacilityType;
  coordinates: [number, number];
  properties?: {
    hours?: string;
    description?: string;
    services?: string[];
    contactInfo?: {
      phone?: string;
      email?: string;
      website?: string;
    };
  };
}

export type FacilityType = 
  | 'dormitory' 
  | 'dining' 
  | 'library' 
  | 'academic' 
  | 'gym' 
  | 'health' 
  | 'parking' 
  | 'recreation'
  | 'administrative'
  | 'student-center';

export interface Room {
  id: string;
  dormId: string;
  dormName: string;
  roomNumber: string;
  floor: number;
  type: RoomType;
  size: number; // in square feet
  capacity: number;
  price: PriceInfo;
  amenities: Amenity[];
  available: boolean;
  images?: string[];
  virtualTour?: string;
  lastUpdated: Date;
}

export type RoomType = 'single' | 'double' | 'triple' | 'quad' | 'suite' | 'apartment';

export interface PriceInfo {
  semesterRate: number;
  yearRate: number;
  includesUtilities: boolean;
  additionalFees?: {
    name: string;
    amount: number;
    frequency: 'once' | 'monthly' | 'semester' | 'yearly';
  }[];
}

export interface Amenity {
  id: string;
  name: string;
  category: AmenityCategory;
  icon?: string;
  description?: string;
}

export type AmenityCategory = 
  | 'basic' 
  | 'comfort' 
  | 'technology' 
  | 'safety' 
  | 'accessibility'
  | 'kitchen'
  | 'bathroom';

export interface FilterCriteria {
  // Location filters
  dormNames?: string[];
  buildingZones?: string[];
  
  // Room filters
  roomTypes?: RoomType[];
  minSize?: number;
  maxSize?: number;
  floors?: number[];
  
  // Price filters
  minPrice?: number;
  maxPrice?: number;
  priceType?: 'semester' | 'year';
  
  // Amenity filters
  requiredAmenities?: string[];
  preferredAmenities?: string[];
  
  // Proximity filters
  maxDistanceTo?: {
    facility: FacilityType;
    distance: number; // in meters
  }[];
  
  // Availability
  availableOnly?: boolean;
  moveInDate?: Date;
  
  // Special requirements
  accessibilityFeatures?: string[];
  quietFloor?: boolean;
  substanceFree?: boolean;
  genderInclusive?: boolean;
}

export interface ComparisonMetrics {
  roomId: string;
  dormName: string;
  roomDetails: Room;
  proximityScores: {
    [key in FacilityType]?: {
      nearest: CampusFacility;
      distance: number;
      walkingTime: number; // in minutes
    };
  };
  overallScore?: number;
  pros: string[];
  cons: string[];
}

export interface MapViewState {
  center: Coordinates;
  zoom: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  activeLayer: 'default' | 'satellite' | 'hybrid';
  visibleFacilities: Set<FacilityType>;
  highlightedFeatures: Set<string>;
  selectedDorm?: string;
}

export interface UserPreferences {
  savedFilters?: FilterCriteria;
  favoriteRooms: string[];
  comparisonHistory: {
    date: Date;
    roomIds: string[];
    notes?: string;
  }[];
  viewPreferences: {
    defaultMapLayer: 'default' | 'satellite';
    showLabels: boolean;
    showLegend: boolean;
    autoZoomOnSelect: boolean;
  };
}

export interface SearchResult {
  type: 'dorm' | 'room' | 'facility';
  id: string;
  name: string;
  matchScore: number;
  highlights?: string[];
  data: DormitoryFeature | Room | CampusFacility;
}

export interface NavigationRoute {
  from: Coordinates;
  to: Coordinates;
  waypoints: Coordinates[];
  distance: number;
  estimatedTime: number;
  instructions: string[];
  accessibility: boolean;
}
