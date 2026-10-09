import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Equipment } from '../types';
import { MapPin, Navigation, Compass, Phone } from 'lucide-react';

// Fix Leaflet default marker icon path issue in Vite bundlers
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Equipment Marker Icon
const equipmentIcon = L.divIcon({
  className: 'custom-eq-marker',
  html: `<div style="background-color: #047857; color: #fbbf24; padding: 6px; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); font-weight: bold;">🚜</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

// Custom User GPS Marker Icon
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="background-color: #dc2626; color: white; padding: 6px; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); font-weight: bold;">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

interface MapViewProps {
  userLat: number;
  userLng: number;
  radiusKm: number;
  equipmentList: (Equipment & { distanceKm?: number })[];
  onSelectEquipment: (eq: Equipment) => void;
  selectedEquipment?: Equipment | null;
}

export const MapView: React.FC<MapViewProps> = ({
  userLat,
  userLng,
  radiusKm,
  equipmentList,
  onSelectEquipment,
  selectedEquipment
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLat, userLng],
        zoom: 10,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;

    if (!map || !layerGroup) return;

    // Clear existing markers
    layerGroup.clearLayers();

    // 1. Add User GPS Marker
    const userMarker = L.marker([userLat, userLng], { icon: userIcon });
    userMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
        <strong style="color: #047857;">📍 Your Farm Location</strong><br/>
        <span>Lat: ${userLat.toFixed(4)}, Lng: ${userLng.toFixed(4)}</span><br/>
        <span style="color: #6b7280;">Search Radius: ${radiusKm} KM</span>
      </div>
    `);
    layerGroup.addLayer(userMarker);

    // 2. Add Search Radius Circle Overlay
    const radiusCircle = L.circle([userLat, userLng], {
      radius: radiusKm * 1000, // convert km to meters
      color: '#047857',
      fillColor: '#10b981',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '5, 5'
    });
    layerGroup.addLayer(radiusCircle);

    // 3. Add Equipment Markers
    equipmentList.forEach((eq) => {
      const eqLat = eq.location.coordinates[1];
      const eqLng = eq.location.coordinates[0];

      const eqMarker = L.marker([eqLat, eqLng], { icon: equipmentIcon });

      const popupContent = `
        <div style="font-family: sans-serif; max-width: 200px; font-size: 12px;">
          <img src="${eq.images[0]}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; mb-2;" />
          <h4 style="font-weight: bold; margin: 4px 0; color: #065f46;">${eq.name}</h4>
          <div style="font-weight: 700; color: #b45309; margin-bottom: 4px;">
            ₹${eq.dailyPrice} <span style="font-weight: normal; font-size: 10px; color: #6b7280;">/ day</span>
          </div>
          <div style="font-size: 11px; color: #4b5563; margin-bottom: 6px;">
            📍 ${eq.location.village}, ${eq.location.district}<br/>
            🛣️ Distance: <strong>${eq.distanceKm !== undefined ? eq.distanceKm : 'N/A'} km</strong>
          </div>
          <button id="btn-book-${eq.id}" style="width: 100%; background: #047857; color: white; border: none; padding: 6px; border-radius: 4px; font-weight: bold; cursor: pointer;">
            Book Machinery
          </button>
        </div>
      `;

      eqMarker.bindPopup(popupContent);

      eqMarker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`btn-book-${eq.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectEquipment(eq);
            };
          }
        }, 100);
      });

      layerGroup.addLayer(eqMarker);
    });

    // 4. Draw route line if equipment is selected
    if (selectedEquipment) {
      const eqLat = selectedEquipment.location.coordinates[1];
      const eqLng = selectedEquipment.location.coordinates[0];
      const polyline = L.polyline(
        [
          [userLat, userLng],
          [eqLat, eqLng]
        ],
        { color: '#f59e0b', weight: 4, opacity: 0.85, dashArray: '8, 8' }
      );
      layerGroup.addLayer(polyline);

      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } else {
      map.setView([userLat, userLng], radiusKm > 30 ? 8 : 10);
    }
  }, [userLat, userLng, radiusKm, equipmentList, selectedEquipment, onSelectEquipment]);

  return (
    <div className="relative w-full h-[400px] lg:h-[480px] rounded-2xl overflow-hidden shadow-lg border border-emerald-800/30">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-100 flex items-center space-x-2 text-xs font-semibold text-emerald-900">
        <Compass className="w-4 h-4 text-emerald-600 animate-spin-slow" />
        <span>OpenStreetMap Live GeoJSON Search ({equipmentList.length} Machinery nearby)</span>
      </div>
    </div>
  );
};
