'use client';

import { useState, useEffect, useCallback } from 'react';
import Map from '../components/Map';
import Sidebar from '../components/Sidebar';
import { useLocalStorage } from '../lib/useLocalStorage';
import { createLocation } from '../lib/locationUtils';
import { initNeighborhoodColors } from '../lib/locationUtils';

export default function Home() {
  const [lastClickedCoords, setLastClickedCoords] = useState(null);
  const [savedLocations, setSavedLocations] = useLocalStorage('savedLocations', []);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Initialize neighborhood colors from localStorage
  useEffect(() => {
    initNeighborhoodColors();
  }, []);

  // Handle map location click
  const handleLocationClick = useCallback((latlng) => {
    setLastClickedCoords(latlng);
  }, []);

  // Handle marker drag
  const handleMarkerDrag = useCallback((latlng) => {
    setLastClickedCoords(latlng);
  }, []);

  // Handle saving a new location
  const handleLocationSave = useCallback((locationData) => {
    const newLocation = createLocation(locationData.name, {
      lat: locationData.lat,
      lng: locationData.lng
    });
    
    // Add date if provided
    if (locationData.date) newLocation.date = locationData.date;
    
    setSavedLocations(prevLocations => [newLocation, ...prevLocations]);
  }, [setSavedLocations]);

  return (
    <div className="map-container">
      <Sidebar
        lastClickedCoords={lastClickedCoords}
        onLocationSave={handleLocationSave}
      />
      <Map
        savedLocations={savedLocations}
        onLocationClick={handleLocationClick}
        onMarkerDrag={handleMarkerDrag}
        selectedLocation={selectedLocation}
      />
    </div>
  );
}