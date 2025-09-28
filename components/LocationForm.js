'use client';

import { useState, useEffect } from 'react';

export default function LocationForm({ lastClickedCoords, onLocationSave }) {
  const [neighborhoodName, setNeighborhoodName] = useState('');
  const [coordinatesText, setCoordinatesText] = useState('Drag the marker to your address!');

  useEffect(() => {
    if (lastClickedCoords) {
      const { lat, lng } = lastClickedCoords;
      setCoordinatesText(`Lat: ${Number(lat).toFixed(6)}, Lng: ${Number(lng).toFixed(6)}`);
    }
  }, [lastClickedCoords]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const name = neighborhoodName.trim();
    if (!lastClickedCoords) {
      alert('Please click on the map to set a location first');
      return;
    }
    
    if (!name) {
      alert('Please enter a name for this location');
      return;
    }

    onLocationSave({
      name,
      lat: lastClickedCoords.lat,
      lng: lastClickedCoords.lng,
      date: new Date().toISOString()
    });

    setNeighborhoodName('');
  };

  return (
    <div className="sidebar-section">
      <h3>Name This Location</h3>
      <form id="locationForm" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="neighborhoodName">Neighborhood Name</label>
          <input
            type="text"
            id="neighborhoodName"
            placeholder="Enter a name for this location"
            required
            value={neighborhoodName}
            onChange={(e) => setNeighborhoodName(e.target.value)}
          />
        </div>
        <div id="coordinates" className="coordinates-display">
          {coordinatesText}
        </div>
        <button type="submit" className="btn-save">
          <i className="fas fa-save"></i> Save Location
        </button>
      </form>
    </div>
  );
}