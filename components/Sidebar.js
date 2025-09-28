'use client';

import LocationForm from './LocationForm';

export default function Sidebar({ lastClickedCoords, onLocationSave }) {
  return (
    <div className="sidebar">
      <LocationForm 
        lastClickedCoords={lastClickedCoords} 
        onLocationSave={onLocationSave} 
      />
    </div>
  );
}