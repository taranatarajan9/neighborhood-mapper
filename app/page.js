'use client';

import { useState, useEffect, useCallback } from 'react';
import Map from '../components/Map';
import Sidebar from '../components/Sidebar';
import { createLocation, saveLocation, loadLocations, initNeighborhoodColors } from '../lib/locationUtils';

export default function Home() {
  const [lastClickedCoords, setLastClickedCoords] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load locations and initialize colors on component mount
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        
        // Initialize neighborhood colors
        await initNeighborhoodColors();
        
        // Load saved locations from Supabase
        const locations = await loadLocations();
        setSavedLocations(locations);
      } catch (err) {
        console.error('Error initializing:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    init();
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
  const handleLocationSave = useCallback(async (locationData) => {
    try {
      const newLocation = createLocation(locationData.name, {
        lat: locationData.lat,
        lng: locationData.lng
      });
      
      // Save location to Supabase
      const savedLocation = await saveLocation(newLocation);
      
      if (savedLocation) {
        // Update local state with the saved location
        setSavedLocations(prevLocations => [savedLocation, ...prevLocations]);
      } else {
        console.error('Failed to save location');
      }
    } catch (err) {
      console.error('Error saving location:', err);
    }
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading map data...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="map-container">
      <Map
        savedLocations={savedLocations}
        onLocationClick={handleLocationClick}
        onMarkerDrag={handleMarkerDrag}
        selectedLocation={selectedLocation}
      />
      <Sidebar
        lastClickedCoords={lastClickedCoords}
        onLocationSave={handleLocationSave}
      />
    </div>
  );
}