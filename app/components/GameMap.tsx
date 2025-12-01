'use client';
import { useState, useMemo } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Layers, ChevronDown, ChevronRight, Sprout, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// --- AVATAR MARKER GENERATOR ---
const createAvatarIcon = (color: string, imageUrl?: string, fallbackIcon?: React.ReactNode) => {
  const content = imageUrl ? (
    <img 
      src={`https://ztnxzxiwywocesmgzkum.supabase.co/storage/v1/object/public/trees/${imageUrl}`} 
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
    />
  ) : (
    <div style={{ color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      {fallbackIcon}
    </div>
  );

  const iconHtml = renderToStaticMarkup(
    <div style={{
      backgroundColor: 'white',
      border: `3px solid ${color}`,
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {content}
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-avatar-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
  });
};

const PARK_CENTER: [number, number] = [14.199631, 120.784193];
const IMAGE_BOUNDS: L.LatLngBoundsExpression = [
  [14.201767606223763, 120.88183865322827], 
  [14.197356171015500, 120.8863796877879]   
];

type Props = {
  trees: any[];
  pois: any[]; 
};

export default function GameMap({ trees, pois }: Props) {
  const [showLegend, setShowLegend] = useState(false);
  const [expandedSection, setExpandedSection] = useState<Record<string, boolean>>({ TREES: true, POI: true }); 
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>({});

  const maxBounds = useMemo(() => {
    return L.latLngBounds(IMAGE_BOUNDS as L.LatLngBoundsLiteral).pad(0.2);
  }, []);

  const toggleVisibility = (id: string) => {
    setHiddenIds(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const toggleSection = (section: string) => {
      setExpandedSection(prev => ({...prev, [section]: !prev[section]}));
  }

  const getImageUrl = (path: string) => 
    path ? `https://ztnxzxiwywocesmgzkum.supabase.co/storage/v1/object/public/trees/${path}` : null;

  return (
    <div className="relative w-full h-full bg-[#1B3124]">
      
      <MapContainer 
        center={PARK_CENTER} 
        zoom={18} 
        minZoom={18.1}
        maxZoom={23}
        scrollWheelZoom={true}
        maxBounds={maxBounds} 
        maxBoundsViscosity={1.0} 
        style={{ height: "100%", width: "100%", backgroundColor: '#1B3124' }}
      >
        <ImageOverlay url="/EcoMap.png" opacity={1} bounds={IMAGE_BOUNDS} />

        {/* --- TREE MARKERS (Updated for Multiple Locations) --- */}
        {trees.map((tree) => {
            // Logic: Use 'locations' array if it exists, otherwise fall back to single lat/lng
            const locations = (tree.locations && tree.locations.length > 0) 
                ? tree.locations 
                : (tree.latitude ? [{ lat: tree.latitude, lng: tree.longitude }] : []);

            // If this tree ID is hidden in legend, don't show ANY of its locations
            if (hiddenIds[`t-${tree.id}`]) return null;

            return locations.map((loc: any, index: number) => (
                <Marker 
                    key={`t-${tree.id}-${index}`} 
                    position={[loc.lat, loc.lng]} 
                    icon={createAvatarIcon('#10b981', tree.image_path, <Sprout size={24}/>)}
                >
                    <Popup>
                        <b className="text-green-700">{tree.common_name}</b>
                        <br/>{tree.scientific_name}
                        {/* Show count if multiple */}
                        {locations.length > 1 && <span className="text-xs text-gray-500 block mt-1">(Location {index + 1} of {locations.length})</span>}
                    </Popup>
                </Marker>
            ));
        })}

        {/* --- POI MARKERS (Updated for Multiple Locations) --- */}
        {pois.map((poi) => {
            const locations = (poi.locations && poi.locations.length > 0) 
                ? poi.locations 
                : (poi.latitude ? [{ lat: poi.latitude, lng: poi.longitude }] : []);

            if (hiddenIds[`p-${poi.id}`]) return null;

            return locations.map((loc: any, index: number) => (
                <Marker 
                    key={`p-${poi.id}-${index}`} 
                    position={[loc.lat, loc.lng]} 
                    icon={createAvatarIcon('#3b82f6', poi.image, <MapPin size={24}/>)}
                >
                    <Popup><b className="text-blue-700">{poi.name}</b><br/>{poi.description}</Popup>
                </Marker>
            ));
        })}

      </MapContainer>

      {/* --- LEGEND SIDEBAR (No changes needed, toggles ID which hides all pins) --- */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <button onClick={() => setShowLegend(!showLegend)} className="bg-white p-3 rounded-xl shadow-xl border-2 border-gray-100">
          <Layers className="w-6 h-6 text-gray-700" />
        </button>

        {showLegend && (
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/50 w-72 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">Map Legend</h4>

            {/* TREES LEGEND */}
            <div className="mb-2">
                <button onClick={() => toggleSection('TREES')} className="w-full flex items-center justify-between p-2 rounded-lg bg-green-50 hover:bg-green-100 transition">
                    <div className="flex items-center gap-2"><Sprout size={16} className="text-emerald-600" /><span className="text-sm font-bold text-emerald-800">Trees ({trees.length})</span></div>
                    {expandedSection['TREES'] ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                </button>
                {expandedSection['TREES'] && (
                    <div className="mt-2 space-y-2 pl-2 border-l-2 border-green-100 ml-2">
                        {trees.map(tree => {
                            const isHidden = hiddenIds[`t-${tree.id}`];
                            return (
                            <div key={tree.id} onClick={() => toggleVisibility(`t-${tree.id}`)} className={`flex items-center gap-3 p-1 rounded cursor-pointer transition ${isHidden ? 'opacity-50 grayscale' : 'hover:bg-gray-50'}`}>
                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300 shrink-0">
                                    {tree.image_path ? <img src={getImageUrl(tree.image_path)!} className="w-full h-full object-cover" /> : <Sprout size={16} className="m-auto text-gray-400"/>}
                                </div>
                                <span className="text-xs font-medium text-gray-700 truncate flex-1">{tree.common_name}</span>
                                <div className={`w-2 h-2 rounded-full ${isHidden ? 'bg-gray-300' : 'bg-green-500'}`} />
                            </div>
                        )})}
                    </div>
                )}
            </div>

            {/* POI LEGEND */}
            <div>
                <button onClick={() => toggleSection('POI')} className="w-full flex items-center justify-between p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition">
                    <div className="flex items-center gap-2"><MapPin size={16} className="text-blue-600" /><span className="text-sm font-bold text-blue-800">Points of Interest ({pois.length})</span></div>
                    {expandedSection['POI'] ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                </button>
                {expandedSection['POI'] && (
                    <div className="mt-2 space-y-2 pl-2 border-l-2 border-blue-100 ml-2">
                        {pois.map(poi => {
                            const isHidden = hiddenIds[`p-${poi.id}`];
                            return (
                            <div key={poi.id} onClick={() => toggleVisibility(`p-${poi.id}`)} className={`flex items-center gap-3 p-1 rounded cursor-pointer transition ${isHidden ? 'opacity-50 grayscale' : 'hover:bg-gray-50'}`}>
                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300 shrink-0">
                                    {poi.image ? <img src={getImageUrl(poi.image)!} className="w-full h-full object-cover" /> : <MapPin size={16} className="m-auto text-gray-400"/>}
                                </div>
                                <span className="text-xs font-medium text-gray-700 truncate flex-1">{poi.name}</span>
                                <div className={`w-2 h-2 rounded-full ${isHidden ? 'bg-gray-300' : 'bg-blue-500'}`} />
                            </div>
                        )})}
                    </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}