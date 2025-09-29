'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchNeighborhoodNames } from '../lib/locationUtils';

export default function LocationForm({ lastClickedCoords, onLocationSave }) {
  const [neighborhoodName, setNeighborhoodName] = useState('');
  const [neighborhoodOptions, setNeighborhoodOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  
  // Load neighborhood options from database
  useEffect(() => {
    async function loadNeighborhoodOptions() {
      setIsLoading(true);
      try {
        const names = await fetchNeighborhoodNames();
        setNeighborhoodOptions(names);
        setFilteredOptions(names);
      } catch (err) {
        console.error('Error loading neighborhood options:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadNeighborhoodOptions();
  }, []);
  
  // Handle clicks outside of the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Filter options as user types
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNeighborhoodName(value);
    
    // Filter options based on input
    if (value.trim()) {
      const filtered = neighborhoodOptions.filter(option => 
        option.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(neighborhoodOptions);
    }
    
    setIsDropdownOpen(true);
  };
  
  // Handle option selection
  const handleOptionSelect = (option) => {
    setNeighborhoodName(option);
    setIsDropdownOpen(false);
  };

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
      <h3>Drag the marker to your home and tell us what you call it! </h3>
      <form id="locationForm" onSubmit={handleSubmit}>
        <div className="form-group" ref={dropdownRef}>
          <label htmlFor="neighborhoodName">I live in: </label>
          <div className="dropdown-container">
            <input
              type="text"
              id="neighborhoodName"
              placeholder={isLoading ? 'Loading neighborhoods...' : 'Search for a neighborhood'}
              required
              value={neighborhoodName}
              onChange={handleInputChange}
              onFocus={() => setIsDropdownOpen(true)}
              autoComplete="off"
            />
            {isDropdownOpen && filteredOptions.length > 0 && (
              <div className="neighborhood-dropdown">
                {filteredOptions.map((option, index) => (
                  <div 
                    key={index} 
                    className="dropdown-option" 
                    onClick={() => handleOptionSelect(option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
            {isDropdownOpen && filteredOptions.length === 0 && (
              <div className="neighborhood-dropdown">
                <div className="dropdown-option no-results">
                  No matches found. Enter a new neighborhood name.
                </div>
              </div>
            )}
          </div>
        </div>
        <button type="submit" className="btn-save">
          <i className="fas fa-map-marker-alt"></i> This is my neighborhood!
        </button>
      </form>
    </div>
  );
}