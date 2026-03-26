import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Grid } from "@mui/material";
import { 
  Box, 
  CircularProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Drawer,
  IconButton,
  Chip,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
  Fab,
  Zoom,
  Alert,
  Snackbar,
  Stack,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import {
  Close as CloseIcon,
  FilterList as FilterListIcon,
  Compare as CompareIcon,
  Restaurant as RestaurantIcon,
  LocalLibrary as LibraryIcon,
  FitnessCenter as GymIcon,
  Layers as LayersIcon,
  MyLocation as MyLocationIcon,
  Map as MapIcon,
  School as SchoolIcon
} from "@mui/icons-material";
import L, { Map as LeafletMap, GeoJSON, Layer, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom icon definitions
// Replace createCustomIcon with SVG-based icons (reliable)
const createCustomIcon = (iconType: string) => {
  const svgMap: Record<string, string> = {
    dormitory: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#800000" d="M12 3 2 12h3v8h6v-5h2v5h6v-8h3L12 3z"/>
    </svg>`,
    dining: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#800000" d="M8 2v9c0 1.1-.9 2-2 2H5v9H3V2h5zm13 0v20h-2v-8h-2V2h4z"/>
    </svg>`,
    // Book icon
    library: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#800000" d="M6 4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h6V4H6zm0 2h4v14H6V6z"/>
      <path fill="#800000" d="M14 4h4c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2h-4V4zm2 2v14h2V6h-2z"/>
      <path fill="#800000" d="M12 4h2v18h-2z"/>
    </svg>`,
    academic: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#800000" d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3zm0 13L4.5 12.2V16l7.5 4 7.5-4v-3.8L12 16z"/>
    </svg>`,
    gym: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#800000" d="M21 9h-2V7h-2v2H7V7H5v2H3v6h2v2h2v-2h10v2h2v-2h2V9z"/>
    </svg>`,
    health: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#800000" d="M19 3H5a2 2 0 0 0-2 2v14h18V5a2 2 0 0 0-2-2zm-6 12h-2v-2H9v-2h2V9h2v2h2v2h-2v2z"/>
    </svg>`,
    parking: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#800000" d="M7 3h6a5 5 0 0 1 0 10H9v8H7V3zm2 2v6h4a3 3 0 0 0 0-6H9z"/>
    </svg>`,
    recreation: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#800000" d="M6 8h12v10H6V8zm2-4h8v2H8V4z"/>
    </svg>`,
  };

  const svg = svgMap[iconType] ?? `<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="6" fill="#800000"/></svg>`;

  return L.divIcon({
    html: `<div style="
      background-color: white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #800000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    ">${svg}</div>`,
    className: "custom-div-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};


function dormNameToHtml(name: string): string | null {
  const key = (name || "").trim().toLowerCase().replace(/\s+/g, " ");

  const map: Record<string, string> = {
    "barton hall": "Barton Hall.html",
    "beman and brinsmade": "Beman and Brinsmade.html",
    "blitman residence commons (rpi)": "Blitman Residence Commons (RPI).html",
    "cary hall": "Cary Hall.html",
    "city station west": "City Station West.html",
    "colonie apartments": "Colonie Apartments.html",
    "crockett hall": "Crockett Hall.html",
    "davison hall": "Davison.html",
    "davison": "Davison.html",
    "hall hall": "Hall Hall.html",
    "nason hall": "Nason Hall.html",
    "warren hall": "Warren Hall.html",
    "north hall": "North Hall.html",
    "e complex": "E Complex.html",
    "blitman residence commons": "Blitman Residence Commons (RPI).html",
    "bryckwyck": "Bryckwyck.html",
    "bray hall": "Bray Hall.html",
    "burdett avenue residence hall": "Burdett Avenue Residence_Hall.html",
    "nugent hall": "Nugent Hall.html",
    "sharp hall": "Sharp Hall.html",
    "stacwyck apartments": "Stacwyck_Apartments.html",
    "quadrangle complex": "Quadrangle_Complex.html",

    // âœ… RAHP variants -> your new filenames
    "rahp a": "RAHP A Site.html",
    "rahp a site": "RAHP A Site.html",
    "rahp a site (single students)": "RAHP A Site.html",

    "rahp b": "RAHP B Site.html",
    "rahp b site": "RAHP B Site.html",
    "rahp b site (married students)": "RAHP B Site.html",
  };

  return map[key] ?? null;
}

type ScoreWeights = {
  price: number;
  distance: number;
  amenities: number;
};

type DormProfile = {
  priceEstimate: number;
  roomTypes: string[];
  restroom: string;
  ac: boolean;
  laundry: boolean;
  diningHall: string;
  amenities: string[];
};

const DEFAULT_PROFILE: DormProfile = {
  priceEstimate: 9750,
  roomTypes: ["Single", "Double"],
  restroom: "Varies",
  ac: true,
  laundry: true,
  diningHall: "Campus Dining",
  amenities: ["Wireless", "Study room"],
};

const DORM_PROFILES: Record<string, DormProfile> = {
  "barton hall": { priceEstimate: 10090, roomTypes: ["Triple"], restroom: "On floor + in room", ac: true, laundry: true, diningHall: "Commons", amenities: ["Wireless", "Kitchenette", "Lounge", "Printer"] },
  "bray hall": { priceEstimate: 9750, roomTypes: ["Single", "Double", "Triple"], restroom: "On floor + in room", ac: true, laundry: true, diningHall: "Commons", amenities: ["Wireless", "Study room", "Kitchenette"] },
  "cary hall": { priceEstimate: 9750, roomTypes: ["Single", "Double", "Triple"], restroom: "On floor + in room", ac: true, laundry: true, diningHall: "Commons", amenities: ["Wireless", "Study room", "Kitchenette"] },
  "crockett hall": { priceEstimate: 9750, roomTypes: ["Single", "Double", "Triple"], restroom: "On floor + in room", ac: true, laundry: true, diningHall: "Commons", amenities: ["Wireless", "Study room", "Kitchenette"] },
  "nason hall": { priceEstimate: 9750, roomTypes: ["Single", "Double", "Triple"], restroom: "On floor + in room", ac: true, laundry: true, diningHall: "Commons", amenities: ["Wireless", "Study room", "Kitchenette"] },
  "quadrangle complex": { priceEstimate: 9750, roomTypes: ["Single", "Double", "Triple"], restroom: "On floor + in room", ac: true, laundry: true, diningHall: "Russell Sage", amenities: ["Wireless", "Kitchenette", "Lounge"] },
  "burdett avenue residence hall": { priceEstimate: 9750, roomTypes: ["Single", "Double"], restroom: "On floor + in room", ac: true, laundry: true, diningHall: "BARH", amenities: ["Wireless", "Lounge", "Kitchenette"] },
  "blitman residence commons": { priceEstimate: 9750, roomTypes: ["Single", "Double"], restroom: "In suite", ac: true, laundry: true, diningHall: "Blitman", amenities: ["Wireless", "Lounge", "Elevator"] },
  "north hall": { priceEstimate: 9750, roomTypes: ["Single", "Double"], restroom: "On floor + in room", ac: true, laundry: true, diningHall: "Russell Sage", amenities: ["Wireless", "Lounge"] },
  "stacwyck apartments": { priceEstimate: 10610, roomTypes: ["Single"], restroom: "In apartment", ac: true, laundry: true, diningHall: "BARH", amenities: ["Wireless", "Kitchen", "Apartment"] },
  "city station west": { priceEstimate: 10610, roomTypes: ["Single"], restroom: "In apartment", ac: true, laundry: true, diningHall: "Blitman", amenities: ["Wireless", "Kitchen", "In-unit laundry"] },
  "colonie apartments": { priceEstimate: 9120, roomTypes: ["Double"], restroom: "In suite", ac: true, laundry: true, diningHall: "BARH", amenities: ["Wireless", "Kitchenette", "Lounge"] },
  "bryckwyck": { priceEstimate: 8800, roomTypes: ["Single"], restroom: "In apartment", ac: true, laundry: true, diningHall: "BARH", amenities: ["Wireless", "Kitchen", "Apartment"] },
};

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}



// Interfaces
interface Facility {
  id: string;
  name: string;
  type: 'dormitory' | 'dining' | 'library' | 'academic' | 'gym' | 'health' | 'parking' | 'recreation';
  coordinates: [number, number];
  properties?: any;
  description?: string;
}

// --- GeoJSON -> Facilities helpers (no hardcoding) ---
function slugify(value: string): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function isAcademicFeature(props: any): boolean {
  if (!props) return false;
  const b = String(props.building || "").toLowerCase();
  const a = String(props.amenity || "").toLowerCase();
  const use = String(props["building:use"] || props.use || "").toLowerCase();
  const landuse = String(props.landuse || "").toLowerCase();
  const office = String(props.office || "").toLowerCase();

  // Common OSM-style tags that indicate education / academic facilities
  if (["academic", "university", "college", "school"].includes(b)) return true;
  if (["university", "college", "school"].includes(a)) return true;
  if (["education", "academic", "university", "college", "school"].includes(use)) return true;
  if (landuse === "education") return true;
  if (office === "educational_institution") return true;

  return false;
}

// --- Campus boundary filtering (remove non-RPI markers) ---
type Ring = [number, number][]; // [lng, lat]
type PolygonCoords = Ring[]; // first ring = outer, others = holes
type MultiPolygonCoords = PolygonCoords[];

function getCampusMultiPolygonCoords(data: any): MultiPolygonCoords {
  try {
    const feat = (data?.features || []).find(
      (f: any) => f?.properties?.name === "Rensselaer Polytechnic Institute" &&
        (f?.geometry?.type === "Polygon" || f?.geometry?.type === "MultiPolygon")
    );
    if (!feat) return [];
    const geom = feat.geometry;
    if (geom.type === "Polygon") return [geom.coordinates as PolygonCoords];
    if (geom.type === "MultiPolygon") return geom.coordinates as MultiPolygonCoords;
    return [];
  } catch {
    return [];
  }
}

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  // Ray casting algorithm
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lng: number, lat: number, poly: PolygonCoords): boolean {
  if (!poly?.length) return false;
  const outer = poly[0];
  if (!pointInRing(lng, lat, outer)) return false;
  // Holes: if point in any hole, it's outside
  for (let k = 1; k < poly.length; k++) {
    if (pointInRing(lng, lat, poly[k])) return false;
  }
  return true;
}

function pointInCampus(lng: number, lat: number, campus: MultiPolygonCoords): boolean {
  for (const poly of campus) {
    if (pointInPolygon(lng, lat, poly)) return true;
  }
  return false;
}

function getFeatureLatLng(feature: any, layer: any): { lat: number; lng: number } | null {
  const t = feature?.geometry?.type;
  if (t === "Point") {
    const [lng, lat] = feature.geometry.coordinates;
    if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
    return null;
  }
  // polygons/multipolygons: use bounds center
  try {
    const center = layer.getBounds().getCenter();
    return { lat: center.lat, lng: center.lng };
  } catch {
    return null;
  }
}

function isDiningFeature(props: any): boolean {
  if (!props) return false;
  const name = String(props.name || "").toLowerCase();
  const amenity = String(props.amenity || "").toLowerCase();
  const fastFood = String(props.fast_food || "").toLowerCase();
  // Prefer true dining halls / cafeterias
  if (fastFood === "cafeteria") return true;
  if (name.includes("dining")) return true;
  // Keep campus food venues, but require they look like campus dining
  if (["restaurant", "fast_food", "cafe"].includes(amenity) && (name.includes("commons") || name.includes("sage") || name.includes("hall"))) return true;
  return false;
}

function isLibraryFeature(props: any): boolean {
  if (!props) return false;
  const name = String(props.name || "").toLowerCase();
  const amenity = String(props.amenity || "").toLowerCase();
  if (amenity === "library") return true;
  if (name.includes("library")) return true;
  return false;
}

function isGymFeature(props: any): boolean {
  if (!props) return false;
  const name = String(props.name || "").toLowerCase();
  const amenity = String(props.amenity || "").toLowerCase();
  const leisure = String(props.leisure || "").toLowerCase();
  if (amenity === "gym" || amenity === "fitness_centre") return true;
  if (["sports_centre", "fitness_centre", "fitness_station"].includes(leisure)) return true;
  if (name.includes("gym") || name.includes("fitness") || name.includes("mueller")) return true;
  return false;
}

function extractAcademicFacilitiesFromGeoJson(data: any, campus: MultiPolygonCoords): Facility[] {
  const out: Facility[] = [];
  if (!data) return out;

  // Temporary layer to compute bounds centers for polygons/multipolygons
  const tmp = L.geoJSON(data, {
    filter: (feature: any) => {
      const t = feature?.geometry?.type;
      return t === "Point" || t === "Polygon" || t === "MultiPolygon";
    },
    onEachFeature: (feature: any, layer: any) => {
      const props = feature?.properties;
      const name = props?.name;
      if (!name) return;

      const ll = getFeatureLatLng(feature, layer);
      if (!ll) return;
      if (campus.length && !pointInCampus(ll.lng, ll.lat, campus)) return;

      // Exclude dormitories explicitly
      const buildingTag = String(props?.building || "").toLowerCase();
      if (buildingTag === "dormitory") return;

      // Exclude other non-learning facilities (they will be extracted separately)
      if (isDiningFeature(props) || isLibraryFeature(props) || isGymFeature(props)) return;

      if (!isAcademicFeature(props)) return;

      out.push({
        id: `acad_${slugify(String(name))}`,
        name: String(name),
        type: "academic",
        coordinates: [ll.lat, ll.lng],
        properties: props,
      });
    },
  });

  // Cleanup (we never add it to the map)
  tmp.remove();
  return out;
}

function extractFacilityTypeFromGeoJson(
  data: any,
  campus: MultiPolygonCoords,
  type: "dining" | "library" | "gym",
  predicate: (props: any) => boolean,
  idPrefix: string
): Facility[] {
  const out: Facility[] = [];
  if (!data) return out;

  const tmp = L.geoJSON(data, {
    filter: (feature: any) => {
      const t = feature?.geometry?.type;
      return t === "Point" || t === "Polygon" || t === "MultiPolygon";
    },
    onEachFeature: (feature: any, layer: any) => {
      const props = feature?.properties;
      const name = props?.name;
      if (!name) return;
      if (!predicate(props)) return;

      const ll = getFeatureLatLng(feature, layer);
      if (!ll) return;
      if (campus.length && !pointInCampus(ll.lng, ll.lat, campus)) return;

      out.push({
        id: `${idPrefix}_${slugify(String(name))}`,
        name: String(name),
        type: type as any,
        coordinates: [ll.lat, ll.lng],
        properties: props,
      });
    },
  });

  tmp.remove();
  return out;
}

interface FilterOptions {
  dormName?: string;
  showFacilities?: {
    dining: boolean;
    library: boolean;
    academic: boolean;
    gym: boolean;
  };
}

interface ComparisonRoom {
  id: string;
  dormName: string;
  price: number;
  roomTypes: string[];
  restroom: string;
  diningHall: string;
  ac: boolean;
  laundry: boolean;
  amenities: string[];
  distanceToFacilities?: {
    dining: number;
    library: number;
    academic: number;
    gym: number;
  };
  averageDistance: number;
  score?: number;
  reasons?: string[];
}

export default function EnhancedMapComponent() {
  // const navigate = useNavigate();
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [geojsonLayer, setGeojsonLayer] = useState<GeoJSON | null>(null);
  const [facilityLayers, setFacilityLayers] = useState<LayerGroup | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    showFacilities: {
      dining: true,
      library: true,
      academic: false,
      gym: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [selectedDorm, setSelectedDorm] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [comparisonRooms, setComparisonRooms] = useState<ComparisonRoom[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [dormCenters, setDormCenters] = useState<Record<string, [number, number]>>({});
  const [scoreWeights, setScoreWeights] = useState<ScoreWeights>({
    price: 35,
    distance: 40,
    amenities: 25,
  });
  const [mapLayer, setMapLayer] = useState<'default' | 'satellite'>('default');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // Snackbar helper
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  }, []);

  // Feature styling
  const getFeatureStyle = useCallback((feature: any) => {
    const isRPI = feature.properties.name === "Rensselaer Polytechnic Institute";
    const isDorm = feature.properties.building === "dormitory";
    const dormName = feature.properties.name;
    const isHovered = hoveredFeature === feature.properties.name;

    if (isRPI) {
      return {
        color: "#ff7800",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.2,
        fillColor: "#ff7800",
      };
    }

    if (isDorm) {
      const matched = !filters.dormName || dormName.toLowerCase().includes(filters.dormName.toLowerCase());
      return {
        color: matched ? "#800000" : "#cccccc",
        weight: matched ? (isHovered ? 5 : 3) : 1,
        fillOpacity: matched ? (isHovered ? 0.8 : 0.6) : 0.2,
        fillColor: matched ? "#800000" : "#cccccc",
        dashArray: isHovered ? '' : undefined
      };
    }

    return {
      color: "#cccccc",
      weight: 1,
      fillOpacity: 0.1,
      fillColor: "#cccccc",
    };
  }, [filters.dormName, hoveredFeature]);

  // Feature interaction
  const handleEachFeature = useCallback((feature: any, layer: Layer) => {
    if (feature.properties.building === "dormitory") {
      const dormName = feature.properties.name;

      const popupContent = `
        <div style="padding: 10px; min-width: 200px;">
          <h3 style="margin: 0 0 10px 0; color: #800000;">${dormName}</h3>
          <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <button onclick="window.postMessage({source:'dorm-map', action: 'viewInfo', dorm: '${dormName}'}, '*')" 
              style="flex: 1; padding: 5px; background: #800000; color: white; border: none; border-radius: 4px; cursor: pointer;">
              View Info
            </button>
            <button onclick="window.postMessage({source:'dorm-map', action: 'compare', dorm: '${dormName}'}, '*')" 
              style="flex: 1; padding: 5px; background: #ccc; color: #333; border: none; border-radius: 4px; cursor: pointer;">
              Compare
            </button>
          </div>
        </div>
      `;

      layer.bindPopup(popupContent);

      layer.on({
        mouseover: (e: any) => {
          setHoveredFeature(dormName);
          e.target.setStyle({ 
            weight: 5, 
            color: "#800000", 
            fillOpacity: 0.8
          });
          if (!e.target.bringToFront) return;
          e.target.bringToFront();
        },
        mouseout: (e: any) => {
          setHoveredFeature(null);
          geojsonLayer?.resetStyle(e.target);
        },
        click: () => {
          setSelectedDorm(dormName);
          setInfoOpen(true);
        }
      });
    }
  }, [geojsonLayer]);

  // Facilities are extracted from GeoJSON (no hardcoding)

  // Add facility markers
  const addFacilityMarkers = useCallback((facilitiesList: Facility[], map: LeafletMap) => {
    if (!map) return;

    if (facilityLayers) {
      map.removeLayer(facilityLayers);
    }

    const layerGroup = L.layerGroup();

    facilitiesList.forEach(facility => {
      const marker = L.marker(facility.coordinates, {
        icon: createCustomIcon(facility.type),
        title: facility.name
      });

      // Attach data to the layer so filtering doesn't rely on coordinate matching
      (marker as any).facility = facility;

      marker.bindPopup(`
        <div style="padding: 10px;">
          <h4 style="margin: 0 0 5px 0;">${facility.name}</h4>
          <p style="margin: 0; color: #666;">${facility.type}</p>
          ${facility.description ? `<p style="margin: 5px 0 0 0; font-size: 12px;">${facility.description}</p>` : ''}
        </div>
      `);

      layerGroup.addLayer(marker);
    });

    layerGroup.addTo(map);
    setFacilityLayers(layerGroup);
  }, [facilityLayers]);

  // Initialize map (SINGLE useEffect!)
useEffect(() => {
  console.log(
    "ðŸ”¥ map init effect fired. mapRef =", mapRef.current,
    "containerRef =", mapContainerRef.current
  );

  // already created or container not ready â†’ do nothing
  if (mapRef.current || !mapContainerRef.current) return;

  console.log("ðŸ—ºï¸ Initializing map...");
  setLoading(true);

  const map = L.map(mapContainerRef.current, {
    maxZoom: 20,
    minZoom: 14,
    attributionControl: false,
    zoomControl: false,
  }).setView([42.730171, -73.6788], 16);

  console.log("âœ… Leaflet map created:", map);
  mapRef.current = map;

  L.control.zoom({ position: "topright" }).addTo(map);
  L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 20,
  }).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 100);

  const loadGeoJson = async () => {
    try {
      console.log("ðŸ“ Fetching GeoJSON...");
      const res = await fetch("assets/map.geojson");  // â† IMPORTANT: no leading "/"
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      console.log("âœ… GeoJSON loaded:", data);
      const centers: Record<string, [number, number]> = {};
      for (const feature of data.features || []) {
        if (feature?.properties?.building !== "dormitory") continue;
        const name = String(feature?.properties?.name || "").trim();
        if (!name) continue;
        try {
          const temp = L.geoJSON(feature as any);
          const center = temp.getBounds().getCenter();
          temp.remove();
          centers[toKey(name)] = [center.lat, center.lng];
        } catch {
          // no-op
        }
      }
      setDormCenters(centers);

      const layer = L.geoJSON(data, {
        filter: (feature) =>
          ["Polygon", "MultiPolygon"].includes(feature.geometry.type),
        style: getFeatureStyle,
        onEachFeature: handleEachFeature,
      }).addTo(map);

      setGeojsonLayer(layer);

      // Derive facilities from GeoJSON (no hardcoding) and restrict them to the RPI campus polygon
      const campus = getCampusMultiPolygonCoords(data);

      const diningFacilities = extractFacilityTypeFromGeoJson(
        data,
        campus,
        "dining",
        isDiningFeature,
        "dining"
      );
      const libraryFacilities = extractFacilityTypeFromGeoJson(
        data,
        campus,
        "library",
        isLibraryFeature,
        "lib"
      );
      const gymFacilities = extractFacilityTypeFromGeoJson(
        data,
        campus,
        "gym",
        isGymFeature,
        "gym"
      );
      const academicFacilities = extractAcademicFacilitiesFromGeoJson(data, campus);

      console.log(
        `ðŸ« Facilities from GeoJSON (campus-only): dining=${diningFacilities.length}, library=${libraryFacilities.length}, gym=${gymFacilities.length}, academic=${academicFacilities.length}`
      );

      const mergedFacilities = [
        ...diningFacilities,
        ...libraryFacilities,
        ...gymFacilities,
        ...academicFacilities,
      ];

      setFacilities(mergedFacilities);
      addFacilityMarkers(mergedFacilities, map);
    } catch (error) {
      console.error("âŒ Failed to load GeoJSON:", error);
      showSnackbar("Failed to load map data. Please check the console.");
    } finally {
      setLoading(false);
    }
  };

  loadGeoJson();

  return () => {
    console.log("ðŸ§¹ Cleaning up map");
    map.remove();
    mapRef.current = null;
  };
  // ðŸ‘‡ IMPORTANT: only run once
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== "dorm-map") return;

      if (data.action === "viewInfo" && data.dorm) {
        console.log("Dorm clicked:", data.dorm);
        const file = dormNameToHtml(data.dorm);
        if (file) {
          // Directly open HTML file inside /pages/
          window.location.href = `/pages/${encodeURIComponent(file)}`;        
        } else {
          console.error("No HTML page found for dorm:", data.dorm);
        }
      }

      if (data.action === "compare" && data.dorm) {
        console.log("Compare clicked for", data.dorm);
        handleQuickCompare(data.dorm);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);




  // Update facility visibility
  useEffect(() => {
    if (!facilityLayers) return;

    facilityLayers.eachLayer((layer: any) => {
      const facility: Facility | undefined = layer.facility;
      if (!facility || !filters.showFacilities) return;

      const key = facility.type as keyof NonNullable<FilterOptions["showFacilities"]>;
      const visible = Boolean((filters.showFacilities as any)[key]);
      layer.setOpacity(visible ? 1 : 0);
    });
  }, [filters.showFacilities, facilityLayers]);

  const removeFromCompare = useCallback((id: string) => {
    setComparisonRooms(prev => prev.filter(r => r.id !== id));
  }, []);

  const clearCompare = useCallback(() => {
    setComparisonRooms([]);
    setComparisonOpen(false);
  }, []);

  const buildComparisonRoom = useCallback((dormName: string): ComparisonRoom | null => {
    const key = toKey(dormName);
    const center = dormCenters[key];
    if (!center) return null;

    const nearest = (type: Facility["type"]) => {
      const group = facilities.filter((f) => f.type === type);
      if (!group.length) return Number.POSITIVE_INFINITY;
      return Math.min(...group.map((f) => haversineMeters(center, f.coordinates)));
    };

    const distanceToFacilities = {
      dining: nearest("dining"),
      library: nearest("library"),
      academic: nearest("academic"),
      gym: nearest("gym"),
    };

    const finite = Object.values(distanceToFacilities).filter((d) => Number.isFinite(d));
    const averageDistance = finite.length ? finite.reduce((a, b) => a + b, 0) / finite.length : 9999;
    const profile = DORM_PROFILES[key] || DORM_PROFILES[key.replace(" (rpi)", "")] || DEFAULT_PROFILE;

    return {
      id: dormName,
      dormName,
      price: profile.priceEstimate,
      roomTypes: profile.roomTypes,
      restroom: profile.restroom,
      diningHall: profile.diningHall,
      ac: profile.ac,
      laundry: profile.laundry,
      amenities: profile.amenities,
      distanceToFacilities,
      averageDistance,
    };
  }, [dormCenters, facilities]);

  const handleQuickCompare = useCallback((dormName: string) => {
    if (comparisonRooms.some((r) => r.id === dormName)) {
      showSnackbar(`${dormName} is already in comparison`);
      setComparisonOpen(true);
      return;
    }

    if (comparisonRooms.length >= 4) {
      showSnackbar("Maximum 4 dorms can be compared at once");
      return;
    }

    const room = buildComparisonRoom(dormName);
    if (!room) {
      showSnackbar(`Could not compute comparison data for ${dormName} yet`);
      return;
    }

    setComparisonRooms((prev) => [...prev, room]);
    setComparisonOpen(true);
    showSnackbar(`Added ${dormName} to comparison`);
  }, [buildComparisonRoom, comparisonRooms, showSnackbar]);

  useEffect(() => {
    localStorage.setItem("rpi_compare_dorms", JSON.stringify(comparisonRooms.map((r) => r.dormName)));
  }, [comparisonRooms]);

  useEffect(() => {
    const saved = localStorage.getItem("rpi_compare_dorms");
    if (!saved || !Object.keys(dormCenters).length || !facilities.length || comparisonRooms.length) return;
    try {
      const names: string[] = JSON.parse(saved);
      const restored = names.map((n) => buildComparisonRoom(n)).filter(Boolean) as ComparisonRoom[];
      if (restored.length) setComparisonRooms(restored.slice(0, 4));
    } catch {
      // ignore malformed storage
    }
  }, [buildComparisonRoom, comparisonRooms.length, dormCenters, facilities.length]);

  useEffect(() => {
    if (!Object.keys(dormCenters).length || !facilities.length || comparisonRooms.length) return;
    const param = new URLSearchParams(window.location.search).get("compare");
    if (!param) return;
    const names = param.split("|").map((s) => s.trim()).filter(Boolean).slice(0, 4);
    const restored = names.map((n) => buildComparisonRoom(n)).filter(Boolean) as ComparisonRoom[];
    if (restored.length) setComparisonRooms(restored);
  }, [buildComparisonRoom, comparisonRooms.length, dormCenters, facilities.length]);

  const scoredRooms = useMemo(() => {
    if (!comparisonRooms.length) return [];

    const min = (arr: number[]) => Math.min(...arr);
    const max = (arr: number[]) => Math.max(...arr);
    const scale = (v: number, lo: number, hi: number, invert = false) => {
      if (lo === hi) return 1;
      const x = (v - lo) / (hi - lo);
      return invert ? 1 - x : x;
    };

    const prices = comparisonRooms.map((r) => r.price);
    const dists = comparisonRooms.map((r) => r.averageDistance);
    const amenCounts = comparisonRooms.map((r) => r.amenities.length);

    return [...comparisonRooms]
      .map((r) => {
        const priceScore = scale(r.price, min(prices), max(prices), true);
        const distanceScore = scale(r.averageDistance, min(dists), max(dists), true);
        const amenityScore = scale(r.amenities.length, min(amenCounts), max(amenCounts), false);
        const weightTotal = scoreWeights.price + scoreWeights.distance + scoreWeights.amenities;

        const score =
          (priceScore * scoreWeights.price +
            distanceScore * scoreWeights.distance +
            amenityScore * scoreWeights.amenities) /
          weightTotal;

        const reasons: string[] = [];
        if (priceScore > 0.66) reasons.push("Lower price");
        if (distanceScore > 0.66) reasons.push("Closer to facilities");
        if (amenityScore > 0.66) reasons.push("More amenities");

        return { ...r, score, reasons };
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [comparisonRooms, scoreWeights]);

  const exportComparisonCsv = useCallback(() => {
    if (!scoredRooms.length) return;

    const header =
      "Rank,Dorm,Score,Price,AvgDistanceM,DiningM,LibraryM,AcademicM,GymM,RoomTypes,AC,Laundry,Restroom,DiningHall,Amenities\\n";

    const rows = scoredRooms.map((r, idx) =>
      [
        idx + 1,
        `"${r.dormName}"`,
        (r.score || 0).toFixed(3),
        r.price,
        Math.round(r.averageDistance),
        Math.round(r.distanceToFacilities?.dining || 0),
        Math.round(r.distanceToFacilities?.library || 0),
        Math.round(r.distanceToFacilities?.academic || 0),
        Math.round(r.distanceToFacilities?.gym || 0),
        `"${r.roomTypes.join("/")}"`,
        r.ac ? "Yes" : "No",
        r.laundry ? "Yes" : "No",
        `"${r.restroom}"`,
        `"${r.diningHall}"`,
        `"${r.amenities.join("; ")}"`,
      ].join(",")
    );

    const blob = new Blob([header + rows.join("\\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rpi-dorm-compare.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [scoredRooms]);

  const copyShareLink = useCallback(async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("compare", comparisonRooms.map((r) => r.dormName).join("|"));
    await navigator.clipboard.writeText(url.toString());
    showSnackbar("Share link copied");
  }, [comparisonRooms, showSnackbar]);
  // Layer toggle
  const handleLayerChange = useCallback((event: React.MouseEvent<HTMLElement>, newLayer: 'default' | 'satellite' | null) => {
    if (!newLayer || !mapRef.current) return;
    
    setMapLayer(newLayer);
    
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current?.removeLayer(layer);
      }
    });

    if (newLayer === 'satellite') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 20,
      }).addTo(mapRef.current);
    } else {
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20,
      }).addTo(mapRef.current);
    }

    if (geojsonLayer) geojsonLayer.bringToFront();
  }, [geojsonLayer]);


  // if (loading) {
  //   return (
  //     <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
  //       <CircularProgress size={60} />
  //     </Box>
  //   );
  // }

  return (
    <Box sx={{ position: 'relative', height: '100vh', width: '100%' }}>
      {/* Map Container */}
      <Box
        ref={mapContainerRef}
        sx={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0
        }}
      />

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            backgroundColor: "rgba(255,255,255,0.7)",
            pointerEvents: "none",
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Control Panel */}
      <Paper 
        elevation={3}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
          padding: 2,
          maxWidth: 300
        }}
      >
        <Typography variant="h6" sx={{ color: '#800000', mb: 2 }}>
          RPI Campus Map
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            icon={<RestaurantIcon />}
            label="Dining"
            color={filters.showFacilities?.dining ? "primary" : "default"}
            onClick={() => setFilters({
              ...filters,
              showFacilities: {
                ...filters.showFacilities!,
                dining: !filters.showFacilities?.dining
              }
            })}
            size="small"
          />
          <Chip
            icon={<LibraryIcon />}
            label="Libraries"
            color={filters.showFacilities?.library ? "primary" : "default"}
            onClick={() => setFilters({
              ...filters,
              showFacilities: {
                ...filters.showFacilities!,
                library: !filters.showFacilities?.library
              }
            })}
            size="small"
          />
          <Chip
            icon={<SchoolIcon />}
            label="Academic"
            color={filters.showFacilities?.academic ? "primary" : "default"}
            onClick={() => setFilters({
              ...filters,
              showFacilities: {
                ...filters.showFacilities!,
                academic: !filters.showFacilities?.academic
              }
            })}
            size="small"
          />
          <Chip
            icon={<GymIcon />}
            label="Recreation"
            color={filters.showFacilities?.gym ? "primary" : "default"}
            onClick={() => setFilters({
              ...filters,
              showFacilities: {
                ...filters.showFacilities!,
                gym: !filters.showFacilities?.gym
              }
            })}
            size="small"
          />
        </Box>

        <ToggleButtonGroup
          value={mapLayer}
          exclusive
          onChange={handleLayerChange}
          size="small"
          fullWidth
        >
          <ToggleButton value="default">
            <MapIcon fontSize="small" sx={{ mr: 0.5 }} />
            Map
          </ToggleButton>
          <ToggleButton value="satellite">
            <LayersIcon fontSize="small" sx={{ mr: 0.5 }} />
            Satellite
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* FAB */}
      <Box sx={{ position: 'absolute', bottom: 100, right: 20, zIndex: 1000 }}>
        <Zoom in={true}>
          <Badge badgeContent={comparisonRooms.length} color="error">
            <Fab
              color="secondary"
              size="medium"
              onClick={() => setComparisonOpen(true)}
              disabled={comparisonRooms.length === 0}
            >
              <CompareIcon />
            </Fab>
          </Badge>
        </Zoom>
      </Box>

      {/* Dialogs - keeping existing code for info, comparison, etc. */}
          <Dialog open={comparisonOpen} onClose={() => setComparisonOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CompareIcon />
          <Typography variant="h6">Compare Dorms</Typography>
          <Chip size="small" label={`${comparisonRooms.length} / 4`} />
        </Box>
        <IconButton onClick={() => setComparisonOpen(false)}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {comparisonRooms.length === 0 ? (
          <Typography color="text.secondary">
            No dorms selected. Click a dorm on the map and press Compare.
          </Typography>
        ) : (
          <Box>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Scoring Weights</Typography>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption">Price ({scoreWeights.price})</Typography>
                  <Slider size="small" value={scoreWeights.price} min={5} max={80} onChange={(_, v) => setScoreWeights((w) => ({ ...w, price: v as number }))} />
                </Box>
                <Box>
                  <Typography variant="caption">Distance ({scoreWeights.distance})</Typography>
                  <Slider size="small" value={scoreWeights.distance} min={5} max={80} onChange={(_, v) => setScoreWeights((w) => ({ ...w, distance: v as number }))} />
                </Box>
                <Box>
                  <Typography variant="caption">Amenities ({scoreWeights.amenities})</Typography>
                  <Slider size="small" value={scoreWeights.amenities} min={5} max={80} onChange={(_, v) => setScoreWeights((w) => ({ ...w, amenities: v as number }))} />
                </Box>
              </Stack>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Button size="small" variant="outlined" onClick={exportComparisonCsv}>Export CSV</Button>
                <Button size="small" variant="outlined" onClick={copyShareLink}>Copy Share Link</Button>
              </Box>
            </Paper>

            <Grid container spacing={2}>
              {scoredRooms.map((r, idx) => (
                <Grid item xs={12} md={6} key={r.id}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#800000" }}>
                          {r.dormName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Rank #{idx + 1} · Score {(r.score || 0).toFixed(3)}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => removeFromCompare(r.id)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                      <Chip size="small" icon={<RestaurantIcon />} label={`${Math.round(r.distanceToFacilities?.dining || 0)} m`} />
                      <Chip size="small" icon={<LibraryIcon />} label={`${Math.round(r.distanceToFacilities?.library || 0)} m`} />
                      <Chip size="small" icon={<SchoolIcon />} label={`${Math.round(r.distanceToFacilities?.academic || 0)} m`} />
                      <Chip size="small" icon={<GymIcon />} label={`${Math.round(r.distanceToFacilities?.gym || 0)} m`} />
                      <Chip size="small" label={`$${r.price}`} />
                      <Chip size="small" label={`Avg ${Math.round(r.averageDistance)}m`} />
                      <Chip size="small" label={r.ac ? "AC" : "No AC"} />
                      <Chip size="small" label={r.laundry ? "Laundry" : "No Laundry"} />
                      {r.reasons?.map((reason) => (
                        <Chip key={reason} size="small" color="success" variant="outlined" label={reason} />
                      ))}
                    </Box>

                    <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          const file = dormNameToHtml(r.dormName);
                          if (file) window.location.href = `/pages/${encodeURIComponent(file)}`;
                          else showSnackbar(`No HTML page found for ${r.dormName}`);
                        }}
                      >
                        Open Info Page
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    {scoredRooms.map((r) => <TableCell key={r.id}>{r.dormName}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Price</TableCell>
                    {scoredRooms.map((r) => <TableCell key={`${r.id}-p`}>${r.price}</TableCell>)}
                  </TableRow>
                  <TableRow>
                    <TableCell>Avg Distance</TableCell>
                    {scoredRooms.map((r) => <TableCell key={`${r.id}-d`}>{Math.round(r.averageDistance)} m</TableCell>)}
                  </TableRow>
                  <TableRow>
                    <TableCell>Amenities</TableCell>
                    {scoredRooms.map((r) => <TableCell key={`${r.id}-a`}>{r.amenities.length}</TableCell>)}
                  </TableRow>
                  <TableRow>
                    <TableCell>Room Types</TableCell>
                    {scoredRooms.map((r) => <TableCell key={`${r.id}-rt`}>{r.roomTypes.join(", ")}</TableCell>)}
                  </TableRow>
                  <TableRow>
                    <TableCell>Restroom</TableCell>
                    {scoredRooms.map((r) => <TableCell key={`${r.id}-rr`}>{r.restroom}</TableCell>)}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={clearCompare} disabled={comparisonRooms.length === 0}>
          Clear All
        </Button>
        <Button onClick={() => setComparisonOpen(false)} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>

      
      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}



