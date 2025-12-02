import { useEffect, useRef, useState, useCallback } from "react";
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
  Snackbar
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
const createCustomIcon = (iconType: string) => {
  const iconMap: Record<string, string> = {
    dormitory: '🏠',
    dining: '🍽️',
    library: '📚',
    academic: '🎓',
    gym: '💪',
    health: '🏥',
    parking: '🅿️',
    recreation: '🎮',
  };

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
      font-size: 16px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    ">${iconMap[iconType] || '📍'}</div>`,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Interfaces
interface Facility {
  id: string;
  name: string;
  type: 'dormitory' | 'dining' | 'library' | 'academic' | 'gym' | 'health' | 'parking' | 'recreation';
  coordinates: [number, number];
  properties?: any;
  description?: string;
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
  roomNumber: string;
  floor: number;
  type: 'single' | 'double' | 'triple' | 'suite';
  size: number;
  price: number;
  amenities: string[];
  available: boolean;
  distanceToFacilities?: {
    dining: number;
    library: number;
    academic: number;
    gym: number;
  };
}

export default function EnhancedMapComponent() {
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
            <button onclick="window.postMessage({action: 'viewInfo', dorm: '${dormName}'}, '*')" 
              style="flex: 1; padding: 5px; background: #800000; color: white; border: none; border-radius: 4px; cursor: pointer;">
              View Info
            </button>
            <button onclick="window.postMessage({action: 'compare', dorm: '${dormName}'}, '*')" 
              style="flex: 1; padding: 5px; background: #ff7800; color: white; border: none; border-radius: 4px; cursor: pointer;">
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

  // Load facilities
  const loadFacilities = useCallback(() => {
    const mockFacilities: Facility[] = [
      { id: 'dining1', name: 'Commons Dining Hall', type: 'dining', coordinates: [42.7305, -73.6795], description: 'Main campus dining' },
      { id: 'dining2', name: 'Sage Dining Hall', type: 'dining', coordinates: [42.7312, -73.6810], description: 'Russell Sage dining' },
      { id: 'lib1', name: 'Folsom Library', type: 'library', coordinates: [42.7298, -73.6829], description: 'Main library' },
      { id: 'gym1', name: 'Mueller Center', type: 'gym', coordinates: [42.7315, -73.6775], description: 'Fitness center' },
    ];
    setFacilities(mockFacilities);
    return mockFacilities;
  }, []);

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
    "🔥 map init effect fired. mapRef =", mapRef.current,
    "containerRef =", mapContainerRef.current
  );

  // already created or container not ready → do nothing
  if (mapRef.current || !mapContainerRef.current) return;

  console.log("🗺️ Initializing map...");
  setLoading(true);

  const map = L.map(mapContainerRef.current, {
    maxZoom: 20,
    minZoom: 14,
    attributionControl: false,
    zoomControl: false,
  }).setView([42.730171, -73.6788], 16);

  console.log("✅ Leaflet map created:", map);
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
      console.log("📍 Fetching GeoJSON...");
      const res = await fetch("assets/map.geojson");  // ← IMPORTANT: no leading "/"
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      console.log("✅ GeoJSON loaded:", data);

      const layer = L.geoJSON(data, {
        filter: (feature) =>
          ["Polygon", "MultiPolygon"].includes(feature.geometry.type),
        style: getFeatureStyle,
        onEachFeature: handleEachFeature,
      }).addTo(map);

      setGeojsonLayer(layer);

      const facilitiesList = loadFacilities();
      addFacilityMarkers(facilitiesList, map);
    } catch (error) {
      console.error("❌ Failed to load GeoJSON:", error);
      showSnackbar("Failed to load map data. Please check the console.");
    } finally {
      setLoading(false);
    }
  };

  loadGeoJson();

  return () => {
    console.log("🧹 Cleaning up map");
    map.remove();
    mapRef.current = null;
  };
  // 👇 IMPORTANT: only run once
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // Update facility visibility
  useEffect(() => {
    if (!facilityLayers || !facilities.length) return;

    facilityLayers.eachLayer((layer: any) => {
      const coords = layer.getLatLng();
      const facility = facilities.find(f => 
        Math.abs(f.coordinates[0] - coords.lat) < 0.0001 && 
        Math.abs(f.coordinates[1] - coords.lng) < 0.0001
      );

      if (facility && filters.showFacilities && filters.showFacilities[facility.type as keyof typeof filters.showFacilities]) {
        layer.setOpacity(1);
      } else {
        layer.setOpacity(0);
      }
    });
  }, [filters.showFacilities, facilityLayers, facilities]);

  // Comparison handlers
  const handleQuickCompare = useCallback((dormName: string) => {
    const mockRoom: ComparisonRoom = {
      id: `${dormName}-101`,
      dormName,
      roomNumber: '101',
      floor: 1,
      type: 'double',
      size: 200,
      price: 4500,
      amenities: ['WiFi', 'Air Conditioning'],
      available: true,
      distanceToFacilities: {
        dining: Math.floor(Math.random() * 500) + 100,
        library: Math.floor(Math.random() * 800) + 200,
        academic: Math.floor(Math.random() * 600) + 150,
        gym: Math.floor(Math.random() * 1000) + 300
      }
    };

    if (comparisonRooms.length < 4) {
      setComparisonRooms([...comparisonRooms, mockRoom]);
      showSnackbar(`Added ${dormName} to comparison`);
    } else {
      showSnackbar('Maximum 4 rooms can be compared at once');
    }
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

  // Listen for messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.action === 'viewInfo') {
        setSelectedDorm(event.data.dorm);
        setInfoOpen(true);
      } else if (event.data.action === 'compare') {
        handleQuickCompare(event.data.dorm);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleQuickCompare]);

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