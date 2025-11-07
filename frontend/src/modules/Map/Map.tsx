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
  Tooltip,
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
  Info as InfoIcon,
  School as SchoolIcon,
  Restaurant as RestaurantIcon,
  LocalLibrary as LibraryIcon,
  FitnessCenter as GymIcon,
  Layers as LayersIcon,
  MyLocation as MyLocationIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Map as MapIcon
} from "@mui/icons-material";
import L, { Map as LeafletMap, GeoJSON, Layer, Marker, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom icon definitions for different facility types
const createCustomIcon = (iconType: string) => {
  const iconMap = {
    dormitory: '🏠',
    dining: '🍽️',
    library: '📚',
    academic: '🎓',
    gym: '💪',
    health: '🏥',
    parking: '🅿️',
    recreation: '🎮'
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

// Interface definitions
interface Facility {
  id: string;
  name: string;
  type: 'dormitory' | 'dining' | 'library' | 'academic' | 'gym' | 'health' | 'parking' | 'recreation';
  coordinates: [number, number];
  properties?: any;
  description?: string;
}

interface DormRoom {
  id: string;
  dormName: string;
  roomNumber: string;
  floor: number;
  type: 'single' | 'double' | 'triple' | 'suite';
  size: number;
  price: number;
  amenities: string[];
  available: boolean;
  images?: string[];
}

interface FilterOptions {
  dormName?: string;
  roomType?: string[];
  priceRange?: [number, number];
  floor?: number[];
  amenities?: string[];
  showFacilities?: {
    dining: boolean;
    library: boolean;
    academic: boolean;
    gym: boolean;
  };
}

interface ComparisonRoom extends DormRoom {
  distanceToFacilities?: {
    dining: number;
    library: number;
    academic: number;
    gym: number;
  };
}

export default function EnhancedMapComponent() {
  const mapRef = useRef<LeafletMap | null>(null);
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

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      setLoading(true);

      if (!mapRef.current) {
        mapRef.current = L.map("map", {
          maxZoom: 20,
          minZoom: 14,
          attributionControl: false,
          zoomControl: false, // We'll add custom zoom controls
        }).setView([42.730171, -73.6788], 16);

        // Add custom zoom control
        L.control.zoom({
          position: 'topright'
        }).addTo(mapRef.current);

        // Add scale control
        L.control.scale({
          imperial: false,
          position: 'bottomright'
        }).addTo(mapRef.current);

        // Default tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 20,
          className: 'default-tiles'
        }).addTo(mapRef.current);
      }

      try {
        // Load GeoJSON data
        const res = await fetch("/assets/map.geojson");
        const data = await res.json();

        const layer = L.geoJSON(data, {
          filter: (feature) => ["Polygon", "MultiPolygon"].includes(feature.geometry.type),
          style: getFeatureStyle,
          onEachFeature: handleEachFeature,
        }).addTo(mapRef.current);

        setGeojsonLayer(layer);

        // Load facilities data (mock data for now)
        loadFacilities();
      } catch (error) {
        console.error("Failed to load GeoJSON:", error);
        showSnackbar("Failed to load map data. Please refresh the page.");
      }

      setLoading(false);
    };

    initializeMap();
  }, []);

  // Load campus facilities
  const loadFacilities = () => {
    // Mock facilities data - in production, this would come from an API
    const mockFacilities: Facility[] = [
      // Dining Halls
      { id: 'dining1', name: 'Commons Dining Hall', type: 'dining', coordinates: [42.7305, -73.6795], description: 'Main campus dining facility' },
      { id: 'dining2', name: 'Sage Dining Hall', type: 'dining', coordinates: [42.7312, -73.6810], description: 'Russell Sage dining' },
      { id: 'dining3', name: 'Blitman Dining', type: 'dining', coordinates: [42.7295, -73.6785], description: 'Blitman Commons dining' },
      
      // Libraries
      { id: 'lib1', name: 'Folsom Library', type: 'library', coordinates: [42.7298, -73.6829], description: 'Main campus library' },
      { id: 'lib2', name: 'Architecture Library', type: 'library', coordinates: [42.7303, -73.6798], description: 'Greene Building library' },
      
      // Academic Buildings
      { id: 'acad1', name: 'DCC - Darrin Communications Center', type: 'academic', coordinates: [42.7293, -73.6797], description: 'Computer Science & IT' },
      { id: 'acad2', name: 'JEC - Jonsson Engineering Center', type: 'academic', coordinates: [42.7299, -73.6802], description: 'Engineering classes' },
      { id: 'acad3', name: 'Low Center', type: 'academic', coordinates: [42.7308, -73.6815], description: 'Science building' },
      
      // Recreation
      { id: 'gym1', name: 'Mueller Center', type: 'gym', coordinates: [42.7315, -73.6775], description: 'Fitness center and pool' },
      { id: 'gym2', name: 'Houston Field House', type: 'gym', coordinates: [42.7280, -73.6795], description: 'Basketball and indoor track' },
    ];

    setFacilities(mockFacilities);
    addFacilityMarkers(mockFacilities);
  };

  // Add facility markers to map
  const addFacilityMarkers = (facilitiesList: Facility[]) => {
    if (!mapRef.current) return;

    // Remove existing facility layers
    if (facilityLayers) {
      mapRef.current.removeLayer(facilityLayers);
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
          <p style="margin: 0; color: #666;">${facility.type.charAt(0).toUpperCase() + facility.type.slice(1)}</p>
          ${facility.description ? `<p style="margin: 5px 0 0 0; font-size: 12px;">${facility.description}</p>` : ''}
        </div>
      `);

      marker.bindTooltip(facility.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -10]
      });

      layerGroup.addLayer(marker);
    });

    layerGroup.addTo(mapRef.current);
    setFacilityLayers(layerGroup);
  };

  // Update facility visibility based on filters
  useEffect(() => {
    if (!facilityLayers || !mapRef.current) return;

    facilityLayers.eachLayer((layer: any) => {
      const shouldShow = Object.entries(filters.showFacilities || {}).some(([type, show]) => {
        const facility = facilities.find(f => 
          f.coordinates[0] === layer.getLatLng().lat && 
          f.coordinates[1] === layer.getLatLng().lng
        );
        return facility && facility.type === type && show;
      });

      if (shouldShow) {
        layer.setOpacity(1);
      } else {
        layer.setOpacity(0);
      }
    });
  }, [filters.showFacilities, facilityLayers, facilities]);

  // Enhanced feature styling
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

  // Enhanced feature interaction
  const handleEachFeature = (feature: any, layer: Layer) => {
    if (feature.properties.building === "dormitory") {
      const dormName = feature.properties.name;

      // Create enhanced popup content
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
          <div style="font-size: 12px; color: #666;">
            Click for more details • Right-click for quick actions
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
            fillOpacity: 0.8,
            dashArray: ''
          });
          e.target.bringToFront();
        },
        mouseout: (e: any) => {
          setHoveredFeature(null);
          geojsonLayer?.resetStyle(e.target);
        },
        click: () => {
          setSelectedDorm(dormName);
          setInfoOpen(true);

          const folderPath = `/assets/dorm_Info/${encodeURIComponent(dormName)}`;
          window.parent.postMessage({ type: "dormFolderPath", path: folderPath }, "*");

          requestAnimationFrame(() => {
            mapRef.current?.fitBounds((layer as L.Polygon).getBounds(), { 
              maxZoom: 18,
              padding: [50, 50]
            });
          });
        },
        contextmenu: (e: any) => {
          // Right-click menu for quick actions
          L.DomEvent.preventDefault(e);
          handleQuickCompare(dormName);
        }
      });
    }
  };

  // Handle adding room to comparison
  const handleQuickCompare = (dormName: string) => {
    // Mock room data - in production, this would come from an API
    const mockRoom: ComparisonRoom = {
      id: `${dormName}-101`,
      dormName,
      roomNumber: '101',
      floor: 1,
      type: 'double',
      size: 200,
      price: 4500,
      amenities: ['WiFi', 'Air Conditioning', 'Shared Bathroom'],
      available: true,
      distanceToFacilities: calculateDistancesToFacilities(dormName)
    };

    if (comparisonRooms.length < 4) {
      setComparisonRooms([...comparisonRooms, mockRoom]);
      showSnackbar(`Added ${dormName} to comparison`);
    } else {
      showSnackbar('Maximum 4 rooms can be compared at once');
    }
  };

  // Calculate distances to facilities (simplified)
  const calculateDistancesToFacilities = (dormName: string): any => {
    // This would use actual geospatial calculations in production
    return {
      dining: Math.floor(Math.random() * 500) + 100,
      library: Math.floor(Math.random() * 800) + 200,
      academic: Math.floor(Math.random() * 600) + 150,
      gym: Math.floor(Math.random() * 1000) + 300
    };
  };

  // Remove room from comparison
  const removeFromComparison = (roomId: string) => {
    setComparisonRooms(comparisonRooms.filter(room => room.id !== roomId));
  };

  // Handle layer toggle
  const handleLayerChange = (event: React.MouseEvent<HTMLElement>, newLayer: 'default' | 'satellite' | null) => {
    if (newLayer && mapRef.current) {
      setMapLayer(newLayer);
      
      // Clear existing tiles
      mapRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          mapRef.current?.removeLayer(layer);
        }
      });

      // Add new tile layer
      if (newLayer === 'satellite') {
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 20,
        }).addTo(mapRef.current);
      } else {
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 20,
        }).addTo(mapRef.current);
      }

      // Re-add other layers
      if (geojsonLayer) {
        geojsonLayer.bringToFront();
      }
      if (facilityLayers) {
        facilityLayers.bringToFront();
      }
    }
  };

  // Center on user location
  const centerOnLocation = () => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.setView([latitude, longitude], 18);
          
          // Add marker for user location
          L.marker([latitude, longitude], {
            icon: L.divIcon({
              html: '<div style="background: #4285F4; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
              className: 'user-location',
              iconSize: [16, 16]
            })
          }).addTo(mapRef.current!).bindPopup('Your Location');
          
          showSnackbar('Centered on your location');
        },
        () => {
          showSnackbar('Unable to get your location');
        }
      );
    }
  };

  // Utility function for snackbar
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // Listen for messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.action === 'viewInfo') {
        setSelectedDorm(event.data.dorm);
        setInfoOpen(true);
      } else if (event.data.action === 'compare') {
        handleQuickCompare(event.data.dorm);
      } else if (typeof event.data === "object" && event.data.filters) {
        setFilters(event.data.filters);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [comparisonRooms]);

  // Update styles when filters change
  useEffect(() => {
    geojsonLayer?.setStyle(getFeatureStyle);
  }, [filters, geojsonLayer, getFeatureStyle]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100vh', width: '100%' }}>
      {/* Main Map */}
      <div id="map" style={{ width: "100%", height: "100%" }} />

      {/* Floating Control Panel */}
      <Paper 
        elevation={3}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
          padding: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Typography variant="h6" sx={{ color: '#800000', fontWeight: 'bold' }}>
          RPI Campus Map
        </Typography>
        
        {/* Quick Facility Toggles */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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

        {/* Map Layer Toggle */}
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

      {/* Floating Action Buttons */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 100,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1000
        }}
      >
        <Zoom in={true}>
          <Fab
            color="primary"
            size="small"
            onClick={centerOnLocation}
            sx={{ backgroundColor: '#4285F4' }}
          >
            <MyLocationIcon />
          </Fab>
        </Zoom>
        
        <Zoom in={true} style={{ transitionDelay: '100ms' }}>
          <Badge badgeContent={comparisonRooms.length} color="error">
            <Fab
              color="secondary"
              size="medium"
              onClick={() => setComparisonOpen(true)}
              disabled={comparisonRooms.length === 0}
              sx={{ backgroundColor: '#ff7800' }}
            >
              <CompareIcon />
            </Fab>
          </Badge>
        </Zoom>

        <Zoom in={true} style={{ transitionDelay: '200ms' }}>
          <Fab
            color="primary"
            size="medium"
            onClick={() => setFilterDrawerOpen(true)}
            sx={{ backgroundColor: '#800000' }}
          >
            <FilterListIcon />
          </Fab>
        </Zoom>
      </Box>

      {/* Dorm Information Dialog */}
      <Dialog 
        open={infoOpen} 
        onClose={() => setInfoOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#800000', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {selectedDorm}
          <IconButton 
            onClick={() => setInfoOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDorm && (
            <iframe
              src={`/assets/dorm_Info/${encodeURIComponent(selectedDorm)}/${encodeURIComponent(selectedDorm)}.html`}
              width="100%"
              height="500px"
              style={{ border: "none" }}
              title={selectedDorm}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => handleQuickCompare(selectedDorm!)}
            color="secondary"
            variant="outlined"
          >
            Add to Compare
          </Button>
          <Button 
            onClick={() => setInfoOpen(false)} 
            color="primary"
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Room Comparison Dialog */}
      <Dialog
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, height: '80vh' }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#ff7800', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Room Comparison ({comparisonRooms.length}/4)
          <IconButton 
            onClick={() => setComparisonOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${Math.min(comparisonRooms.length, 4)}, 1fr)`,
            gap: 2,
            mt: 2
          }}>
            {comparisonRooms.map((room) => (
              <Paper key={room.id} elevation={2} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {room.dormName}
                  </Typography>
                  <IconButton 
                    size="small"
                    onClick={() => removeFromComparison(room.id)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Room {room.roomNumber} • Floor {room.floor}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2"><strong>Type:</strong> {room.type}</Typography>
                  <Typography variant="body2"><strong>Size:</strong> {room.size} sq ft</Typography>
                  <Typography variant="body2"><strong>Price:</strong> ${room.price}/semester</Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Amenities:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {room.amenities.map((amenity) => (
                      <Chip key={amenity} label={amenity} size="small" />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Distance to:
                  </Typography>
                  <Typography variant="caption" display="block">
                    🍽️ Dining: {room.distanceToFacilities?.dining}m
                  </Typography>
                  <Typography variant="caption" display="block">
                    📚 Library: {room.distanceToFacilities?.library}m
                  </Typography>
                  <Typography variant="caption" display="block">
                    🎓 Academic: {room.distanceToFacilities?.academic}m
                  </Typography>
                  <Typography variant="caption" display="block">
                    💪 Gym: {room.distanceToFacilities?.gym}m
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>

          {comparisonRooms.length === 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: 'text.secondary'
            }}>
              <CompareIcon sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6">No rooms selected for comparison</Typography>
              <Typography variant="body2">
                Right-click on dormitories or use the "Add to Compare" button to start comparing
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComparisonRooms([])}>
            Clear All
          </Button>
          <Button onClick={() => setComparisonOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: { width: 350, p: 3 }
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, color: '#800000', fontWeight: 'bold' }}>
          Advanced Filters
        </Typography>
        
        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
          Room Type
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {['Single', 'Double', 'Triple', 'Suite'].map(type => (
            <Chip
              key={type}
              label={type}
              onClick={() => {/* Handle room type filter */}}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
          Price Range
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small">$0-3000</Button>
          <Button variant="outlined" size="small">$3000-5000</Button>
          <Button variant="outlined" size="small">$5000+</Button>
        </Box>

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
          Floor Preference
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {[1, 2, 3, 4, 5].map(floor => (
            <Chip
              key={floor}
              label={`Floor ${floor}`}
              onClick={() => {/* Handle floor filter */}}
              variant="outlined"
            />
          ))}
        </Box>

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
          Amenities
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {['WiFi', 'Air Conditioning', 'Private Bathroom', 'Kitchen', 'Laundry'].map(amenity => (
            <Chip
              key={amenity}
              label={amenity}
              onClick={() => {/* Handle amenity filter */}}
              variant="outlined"
            />
          ))}
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            fullWidth
            onClick={() => {
              setFilters({
                showFacilities: {
                  dining: true,
                  library: true,
                  academic: false,
                  gym: false
                }
              });
            }}
          >
            Reset Filters
          </Button>
          <Button 
            variant="contained" 
            fullWidth
            onClick={() => setFilterDrawerOpen(false)}
          >
            Apply Filters
          </Button>
        </Box>
      </Drawer>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}