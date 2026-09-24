"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix missing marker icons in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapPickerProps {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
}

function MapUpdater() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);
  return null;
}

function LocationMarker({ position, setPosition }: MapPickerProps) {
  const map = useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (position) {
      // Only flyTo if the new position is significantly far from current center
      // This prevents stuttering when dragging the marker.
      const currentCenter = map.getCenter();
      const distance = currentCenter.distanceTo(L.latLng(position.lat, position.lng));
      if (distance > 100) { 
        map.flyTo(position, map.getZoom());
      }
    }
  }, [position?.lat, position?.lng, map]);

  return position === null ? null : (
    <Marker 
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          if (marker != null) {
            const pos = marker.getLatLng();
            setPosition({ lat: pos.lat, lng: pos.lng });
            map.flyTo(pos, map.getZoom());
          }
        },
      }}
    />
  );
}

export default function MapPicker({ position, setPosition }: MapPickerProps) {
  const defaultPosition: [number, number] = [-6.2088, 106.8456]; // Jakarta Default

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-zinc-200 shadow-sm z-0 relative">
      <MapContainer
        center={position ? [position.lat, position.lng] : defaultPosition}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  );
}
