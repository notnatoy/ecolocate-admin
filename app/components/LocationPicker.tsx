'use client';
import { useState, useMemo, useEffect } from 'react';
import { MapContainer, ImageOverlay, Marker, useMapEvents, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- 1. RAW SVG ICON (No external files needed) ---
const treeIcon = L.divIcon({
  className: 'bg-transparent',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981" stroke="#064e3b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width: 100%; height: 100%; filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3));">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3" fill="white"></circle>
    </svg>
  `,
  iconSize: [40, 40],  
  iconAnchor: [20, 40], 
  popupAnchor: [0, -40] 
});

// --- CONFIGURATION ---
const PARK_CENTER: [number, number] = [14.199631, 120.884193];

const IMAGE_BOUNDS: L.LatLngBoundsExpression = [
  [14.201767606223763, 120.88183865322827], // North-West
  [14.197356171015500, 120.8863796877879]   // South-East
];

export type LocationPoint = {
    lat: number;
    lng: number;
};

type Props = {
  initialLocations?: LocationPoint[]; 
  onLocationsChange: (locations: LocationPoint[]) => void;
};

// Helper to handle map clicks
function MapEvents({ onAddPoint }: { onAddPoint: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onAddPoint(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ initialLocations = [], onLocationsChange }: Props) {
  // State for multiple markers
  const [points, setPoints] = useState<LocationPoint[]>(initialLocations);

  // Sync state if parent updates initialLocations (e.g. switching between trees)
  useEffect(() => {
    if (initialLocations) {
        setPoints(initialLocations);
    }
  }, [initialLocations]);

  const maxBounds = useMemo(() => {
    return L.latLngBounds(IMAGE_BOUNDS as L.LatLngBoundsLiteral).pad(0.02);
  }, []);

  // ADD MARKER
  const handleAdd = (lat: number, lng: number) => {
    const newPoint = { lat, lng };
    const updatedList = [...points, newPoint];
    setPoints(updatedList);
    
    // Safety check to prevent crash if prop is missing
    if (onLocationsChange) {
        onLocationsChange(updatedList);
    }
  };

  // REMOVE MARKER
  const handleRemove = (indexToRemove: number) => {
    const updatedList = points.filter((_, index) => index !== indexToRemove);
    setPoints(updatedList);
    if (onLocationsChange) {
        onLocationsChange(updatedList);
    }
  };

  const handleClearAll = () => {
    setPoints([]);
    if (onLocationsChange) {
        onLocationsChange([]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
        {/* Map Container */}
        <div className="h-[450px] w-full rounded-xl overflow-hidden border-2 border-gray-200 relative z-0 bg-[#1B3124] shadow-inner">
            <MapContainer 
                center={points.length > 0 ? [points[0].lat, points[0].lng] : PARK_CENTER} 
                zoom={17} 
                minZoom={16}
                maxZoom={22}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%", backgroundColor: '#1B3124' }}
                maxBounds={maxBounds} 
                maxBoundsViscosity={1.0}
            >
                {/* 1. Map Image */}
                <ImageOverlay
                    url="/EcoMap.png" 
                    bounds={IMAGE_BOUNDS}
                    opacity={0.9} 
                    zIndex={1}
                />
                
                {/* 2. Markers */}
                {points.map((pt, index) => (
                    <Marker 
                        key={`${pt.lat}-${pt.lng}-${index}`} 
                        position={[pt.lat, pt.lng]} 
                        icon={treeIcon} 
                        eventHandlers={{
                            click: (e) => {
                                // Stop the map click event so we don't add a new pin while deleting
                                L.DomEvent.stopPropagation(e as any);
                                handleRemove(index);
                            }
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -40]} opacity={1}>
                            Click to delete
                        </Tooltip>
                    </Marker>
                ))}
                
                {/* 3. Click Listener */}
                <MapEvents onAddPoint={handleAdd} />
            </MapContainer>
            
            {/* Overlay Info Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end pointer-events-none z-[1000]">
                <div className="bg-white/95 text-gray-800 px-3 py-2 rounded-lg text-xs font-semibold shadow-lg backdrop-blur border border-gray-200">
                    {points.length > 0 
                        ? `${points.length} locations selected` 
                        : "Click map to pin tree locations"}
                </div>

                {points.length > 0 && (
                    <button 
                        onClick={handleClearAll}
                        className="pointer-events-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition-colors flex items-center gap-1"
                    >
                       Reset Map
                    </button>
                )}
            </div>
        </div>
        
        {/* Debug View (Optional) */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs font-mono text-gray-500 break-all">
            <strong>Coordinates:</strong> {JSON.stringify(points.map(p => [Number(p.lat.toFixed(5)), Number(p.lng.toFixed(5))]))}
        </div>
    </div>
  );
}