import { useEffect, useRef, useState } from "react";
import L, { GeoJSON, Map as LeafletMap, GeoJSONOptions, Layer } from "leaflet";
import "leaflet/dist/leaflet.css";

// Define the filter structure
interface Filters {
    dormName?: string;
}

const MapComponent = () => {
    const mapRef = useRef<LeafletMap | null>(null);
    const [geojsonLayer, setGeojsonLayer] = useState<GeoJSON | null>(null);
    const [filters, setFilters] = useState<Filters>({});

    // Initialize the map only once
    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = L.map("map", {
                maxZoom: 20,
                minZoom: 15,
                attributionControl: false,
            }).setView([42.730171, -73.678800], 16);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 20,
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapRef.current);
        }

        // Load the GeoJSON data
        fetch("/assets/map.geojson")
            .then((res) => res.json())
            .then((data) => {
                if (geojsonLayer) {
                    geojsonLayer.remove(); // Remove previous layer
                }

                const newLayer = L.geoJSON(data, {
                    filter: (feature) =>
                        ["Polygon", "MultiPolygon"].includes(feature.geometry.type),
                    style: getFeatureStyle,
                    onEachFeature: handleEachFeature,
                } as GeoJSONOptions).addTo(mapRef.current!);

                setGeojsonLayer(newLayer);
            })
            .catch((err) => {
                console.error("Failed to load GeoJSON:", err);
            });
    }, []);

    // Style each feature based on its properties and current filters
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
            const matchFilter =
                !filters.dormName ||
                dormName.toLowerCase().includes(filters.dormName.toLowerCase());
            return {
                color: "#800000",
                weight: matchFilter ? 3 : 1,
                opacity: 1,
                fillOpacity: matchFilter ? 0.7 : 0.2,
                fillColor: matchFilter ? "#800000" : "#cccccc",
            };
        }

        return {
            color: "#cccccc",
            weight: 1,
            opacity: 0.3,
            fillOpacity: 0.1,
            fillColor: "#cccccc",
        };
    };

    // Handle events for each feature
    const handleEachFeature = (feature: any, layer: Layer) => {
        if (feature.properties.building === "dormitory") {
            const dormName = feature.properties.name;

            layer.bindPopup(`<b>${dormName}</b>`);

            layer.on({
                mouseover: (e: any) => {
                    e.target.setStyle({ weight: 4, color: "#800000", fillOpacity: 0.75 });
                },
                mouseout: (e: any) => {
                    geojsonLayer?.resetStyle(e.target);
                },
                click: () => {
                    const folderPath = `/src/assets/dorm_Info/${encodeURIComponent(dormName)}`;
                    window.parent.postMessage(
                        {
                            type: "dormFolderPath",
                            path: folderPath,
                        },
                        "*"
                    );

                    // Zoom into the selected building
                    requestAnimationFrame(() => {
                        mapRef.current?.fitBounds((layer as L.Polygon).getBounds(), {
                            maxZoom: 18,
                        });
                    });
                },
            });
        }
    };

    // Listen for filter messages from other components
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (typeof event.data === "object" && "dormName" in event.data) {
                setFilters(event.data);
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    // Update styles when filters change
    useEffect(() => {
        geojsonLayer?.setStyle(getFeatureStyle);
    }, [filters, geojsonLayer]);

    return <div id="map" style={{ width: "125vh", height: "100vh" }} />;
};

export default MapComponent;
