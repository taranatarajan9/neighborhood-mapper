'use client';

import { useCallback } from 'react';
import LocationForm from './LocationForm';

export default function Sidebar({ savedLocations, lastClickedCoords, onLocationSave, onLocationSelect }) {
  const handleLocationClick = useCallback((location) => {
    onLocationSelect({
      lat: location.lat,
      lng: location.lng
    });
  }, [onLocationSelect]);

  return (
    <div className="sidebar">
      <LocationForm 
        lastClickedCoords={lastClickedCoords} 
        onLocationSave={onLocationSave} 
      />
      
      <div className="sidebar-section saved-locations">
        <h3>Saved Locations</h3>
        <div id="savedLocations">
          {savedLocations.length === 0 ? (
            <p className="no-locations">No locations saved yet</p>
          ) : (
            savedLocations.map((location, index) => (
              <div 
                key={location.id || index} 
                className="location-item" 
                onClick={() => handleLocationClick(location)}
              >
                <h5>{location.name || (location.names && location.names[0])}</h5>
                <p>
                  {Number(location.lat).toFixed(4)}, {Number(location.lng).toFixed(4)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}