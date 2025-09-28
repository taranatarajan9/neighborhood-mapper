'use client';

import { useEffect, useState, useRef } from 'react';
import { updateMapWithLocations } from '../lib/mapUtils';

export default function Map({ 
  savedLocations, 
  onLocationClick, 
  onMarkerDrag, 
  selectedLocation 
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const locationLayersRef = useRef(null);
  const [L, setL] = useState(null);

  // Initialize Leaflet when component mounts
  useEffect(() => {
    // Dynamically import Leaflet only on the client side
    if (typeof window !== 'undefined' && !L) {
      import('leaflet').then(leaflet => {
        setL(leaflet.default);
      });
    }
  }, [L]);

  // Initialize map once Leaflet is loaded
  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return;

    // Create map
    const mapInstance = L.map(mapRef.current, {
      center: [37.7749, -122.4194],
      zoom: 13,
      zoomControl: false,
      preferCanvas: true,
      renderer: L.canvas(),
      trackResize: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      detectRetina: true
    }).addTo(mapInstance);

    L.control.zoom({ position: 'topright' }).addTo(mapInstance);

    // Add layers
    const locationLayers = L.featureGroup().addTo(mapInstance);
    locationLayersRef.current = locationLayers;

    // Add draggable marker
    const marker = L.marker([37.7749, -122.4194], {
      draggable: true,
      autoPan: true
    }).addTo(mapInstance);
    markerRef.current = marker;

    // Set up events
    mapInstance.on('click', handleMapClick);
    marker.on('dragend', handleMarkerDrag);

    // Store map instance in ref
    mapInstanceRef.current = mapInstance;

    // Ensure proper sizing
    setTimeout(() => {
      if (mapInstance) mapInstance.invalidateSize(true);
    }, 100);

    // Clean up on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [L]);

  // Update map when savedLocations change
  useEffect(() => {
    if (L && mapInstanceRef.current && locationLayersRef.current) {
      updateMapWithLocations(
        mapInstanceRef.current,
        savedLocations,
        locationLayersRef.current,
        L
      );
    }
  }, [savedLocations, L]);

  // Update marker position when selectedLocation changes
  useEffect(() => {
    if (selectedLocation && markerRef.current && mapInstanceRef.current) {
      const { lat, lng } = selectedLocation;
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], 15);
      
      // Notify parent about the marker position
      onMarkerDrag({ lat, lng });
    }
  }, [selectedLocation, onMarkerDrag]);

  const handleMapClick = (e) => {
    if (markerRef.current) {
      markerRef.current.setLatLng(e.latlng);
      onLocationClick(e.latlng);
    }
  };

  const handleMarkerDrag = (e) => {
    if (markerRef.current) {
      const newLatLng = e.target.getLatLng();
      onMarkerDrag(newLatLng);
    }
  };

  return (
    <div id="map-container">
      <div id="map" ref={mapRef}></div>
    </div>
  );
}