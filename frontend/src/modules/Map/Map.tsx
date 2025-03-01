import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = () => {
    const mapRef = useRef<L.Map | null>(null);
    const [geojsonLayer, setGeojsonLayer] = useState<L.GeoJSON | null>(null);
    const [filters, setFilters] = useState<{ dormName?: string }>({});

    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = L.map("map", {
                maxZoom: 20,
                minZoom: 15
            }).setView([42.730171, -73.678800], 16);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 20
            }).addTo(mapRef.current);
        }

        fetch("../../../public/assets/map.geojson")
            .then(response => response.json())
            .then(data => {
                const layer = L.geoJSON(data, {
                    filter: feature => ["Polygon", "MultiPolygon"].includes(feature.geometry.type),
                    style: getFeatureStyle,
                    onEachFeature
                }).addTo(mapRef.current!);
                setGeojsonLayer(layer);
            });
    }, []);

    const getFeatureStyle = (feature: any) => {
        if (feature.properties.name === "Rensselaer Polytechnic Institute") {
            return {
                color: "#ff7800",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.3,
                fillColor: "#ff7800"
            };
        }
        if (feature.properties.building === "dormitory") {
            const dormNameFilter = filters.dormName;
            if (!dormNameFilter || feature.properties.name.toLowerCase().includes(dormNameFilter.toLowerCase())) {
                return {
                    color: "#800000",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.7,
                    fillColor: "#800000"
                };
            }
        }
        return {
            color: "#cccccc",
            weight: 1,
            opacity: 0.3,
            fillOpacity: 0.1,
            fillColor: "#cccccc"
        };
    };

    const onEachFeature = (feature: any, layer: L.Layer) => {
        if (feature.properties.building === "dormitory") {
            layer.bindPopup(feature.properties.name);
            layer.on({
                mouseover: (e: any) => {
                    e.target.setStyle({ weight: 5, color: "#800000", fillOpacity: 0.7 });
                },
                mouseout: (e: any) => {
                    geojsonLayer?.resetStyle(e.target);
                },
                click: () => {
                    const dormName = feature.properties.name;
                    const folderPath = `/src/assets/dorm_Info/${encodeURIComponent(dormName)}`;
                    window.parent.postMessage({
                        type: "dormFolderPath",
                        path: folderPath
                    }, "*");
                    requestAnimationFrame(() => {
                        mapRef.current?.fitBounds((layer as L.Polygon).getBounds());
                    });
                }
            });
        }
    };

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (typeof event.data === "object") {
                setFilters(event.data);
                geojsonLayer?.setStyle(getFeatureStyle);
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [geojsonLayer]);

    return <div id="map" style={{ width: "125vh", height: "100vh" }} />;
};

export default MapComponent;
