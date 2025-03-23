import { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import L, { Map as LeafletMap, GeoJSON, Layer } from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MapComponent() {
  const mapRef = useRef<LeafletMap | null>(null);
  const [geojsonLayer, setGeojsonLayer] = useState<GeoJSON | null>(null);
  const [filters, setFilters] = useState<{ dormName?: string }>({});
  const [loading, setLoading] = useState(false);
  const [selectedDorm, setSelectedDorm] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    const initializeMap = async () => {
      setLoading(true);

      if (!mapRef.current) {
        mapRef.current = L.map("map", {
          maxZoom: 20,
          minZoom: 15,
          attributionControl: false,
        }).setView([42.730171, -73.6788], 16);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 20,
        }).addTo(mapRef.current);
      }

      try {
        const res = await fetch("/assets/map.geojson");
        const data = await res.json();

        const layer = L.geoJSON(data, {
          filter: (feature) => ["Polygon", "MultiPolygon"].includes(feature.geometry.type),
          style: getFeatureStyle,
          onEachFeature: handleEachFeature,
        }).addTo(mapRef.current);

        setGeojsonLayer(layer);
      } catch (error) {
        console.error("Failed to load GeoJSON:", error);
        alert("Failed to load map data.");
      }

      setLoading(false);
    };

    initializeMap();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === "object") {
        setFilters(event.data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    geojsonLayer?.setStyle(getFeatureStyle);
  }, [filters, geojsonLayer]);

  const getFeatureStyle = (feature: any) => {
    const isRPI = feature.properties.name === "Rensselaer Polytechnic Institute";
    const isDorm = feature.properties.building === "dormitory";
    const dormName = feature.properties.name;

    if (isRPI) {
      return {
        color: "#ff7800",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.3,
        fillColor: "#ff7800",
      };
    }

    if (isDorm) {
      const matched = !filters.dormName || dormName.toLowerCase().includes(filters.dormName.toLowerCase());
      return {
        color: matched ? "#800000" : "#cccccc",
        weight: matched ? 3 : 1,
        fillOpacity: matched ? 0.7 : 0.2,
        fillColor: matched ? "#800000" : "#cccccc",
      };
    }

    return {
      color: "#cccccc",
      weight: 1,
      fillOpacity: 0.1,
      fillColor: "#cccccc",
    };
  };

  const handleEachFeature = (feature: any, layer: Layer) => {
    if (feature.properties.building === "dormitory") {
      const dormName = feature.properties.name;

      layer.bindPopup(dormName);

      layer.on({
        mouseover: (e: any) => {
          e.target.setStyle({ weight: 5, color: "#800000", fillOpacity: 0.7 });
        },
        mouseout: (e: any) => {
          geojsonLayer?.resetStyle(e.target);
        },
        click: () => {
          setSelectedDorm(dormName);
          setInfoOpen(true);

          const folderPath = `/assets/dorm_Info/${encodeURIComponent(dormName)}`;
          window.parent.postMessage({ type: "dormFolderPath", path: folderPath }, "*");

          requestAnimationFrame(() => {
            mapRef.current?.fitBounds((layer as L.Polygon).getBounds(), { maxZoom: 18 });
          });
        },
      });
    }
  };

//   if (loading) {
//     return (
//       <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
//         <CircularProgress />
//       </Box>
//     );
//   }

  return (
    <div>
      <Box>
        <div id="map" style={{ width: "125vh", height: "100vh" }} />
      </Box>

      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedDorm}</DialogTitle>
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
          <Button onClick={() => setInfoOpen(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

    </div>
  );
}
