// Import utility modules
import { 
    createLocation, 
    saveToLocalStorage, 
    loadFromLocalStorage,
    groupLocationsById,
    getNeighborhoodColor
} from './locationUtils.js';

import { 
    drawLocationSquare, 
    updateMapWithLocations as updateMap 
} from './mapUtils.js';

// Store the last clicked coordinates and map state
let lastClickedCoords = null;
let map = null;
let currentMarker = null;
let savedLocations = [];
let locationLayerGroup = null; // This will hold our location markers

// Make sure the DOM is fully loaded
function initializeApp() {
    console.log('Initializing app...');
    
    // Initialize the map
    initMap();
    
    // Load saved locations
    savedLocations = loadFromLocalStorage();
    
    // Initialize the UI
    initEventListeners();
    
    // Update the map with any saved locations
    updateMapWithLocations();
    
    console.log('App initialization complete');
}

// Start the application when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already ready
    initializeApp();
}

// Initialize the map
function initMap() {
    console.log('Initializing map...');
    
    // Make sure the map container exists and is visible
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map container not found!');
        return;
    }
    
    // Make sure Leaflet is available
    if (typeof L === 'undefined') {
        console.error('Leaflet is not loaded!');
        return;
    }
    
    console.log('Leaflet version:', L.version);
    
    try {
        console.log('Creating map instance...');
        
        // Initialize the map centered on San Francisco
        map = L.map('map', {
            center: [37.7749, -122.4194],
            zoom: 12,
            zoomControl: false, // We'll add it manually
            preferCanvas: true,  // Better performance for many markers
            renderer: L.canvas(),
            // Add these options to help with debugging
            fadeAnimation: false,
            markerZoomAnimation: false
        });
        
        console.log('Map instance created:', map);
        
        // Add event listeners for map loading
        map.on('load', () => console.log('Map loaded event fired'));
        map.on('tileload', (e) => console.log('Tile loaded:', e.url));
        map.on('tileerror', (e) => console.error('Tile error:', e.url, e.error));
        
        // Add OpenStreetMap tiles with error handling
        console.log('Adding OpenStreetMap layer...');
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            detectRetina: true,
            // Add these options to help with debugging
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEtAKsWX8U3wAAAABJRU5ErkJggg==',
            crossOrigin: true
        }).addTo(map);
        
        console.log('OpenStreetMap layer added');
        
        // Create a layer group for location markers
        locationLayerGroup = L.layerGroup().addTo(map);
        
        // Add zoom control
        console.log('Adding zoom control...');
        L.control.zoom({
            position: 'topright'
        }).addTo(map);
        
        // Add click handler to the map
        map.on('click', onMapClick);
        
        // Function to initialize map size
        const initMapSize = () => {
            if (!map) return;
            
            console.log('Initializing map size...');
            console.log('Map container dimensions:', {
                width: mapElement.offsetWidth,
                height: mapElement.offsetHeight,
                style: window.getComputedStyle(mapElement).display
            });
            
            // Force the map to update its size
            map.invalidateSize();
            
            // Check if the map has valid bounds
            const bounds = map.getBounds();
            console.log('Map bounds:', bounds);
            
            if (!bounds.isValid() || bounds.getNorthEast().equals(bounds.getSouthWest())) {
                console.warn('Map bounds are not valid, retrying...');
                setTimeout(initMapSize, 100);
            } else {
                console.log('Map initialized successfully with bounds:', bounds);
            }
        };
        
        // Initial size check with a small delay
        setTimeout(initMapSize, 100);
        
        // Also check on window resize
        window.addEventListener('resize', () => {
            console.log('Window resized, updating map size...');
            setTimeout(initMapSize, 100);
        });
        
        console.log('Map initialization complete');
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Initialize event listeners
function initEventListeners() {
    // Form submission
    document.getElementById('locationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!lastClickedCoords) {
            alert('Please click on the map to select a location first');
            return;
        }
        
        const nameInput = document.getElementById('neighborhoodName');
        const locationName = nameInput.value.trim();
        
        if (!locationName) {
            alert('Please enter a name for this location');
            return;
        }
        
        // Save the location
        saveLocation(locationName, lastClickedCoords);
        
        // Clear the input
        nameInput.value = '';
        
        // Update the UI
        updateMapWithLocations();
    });
}

// Handle map click events
function onMapClick(e) {
    // Store the clicked coordinates
    lastClickedCoords = e.latlng;
    
    // Update the marker
    updateMarker(e.latlng);
    
    // Focus the input field
    document.getElementById('neighborhoodName').focus();
}

// Update the marker position
function updateMarker(latlng) {
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }
    
    currentMarker = L.marker(latlng)
        .addTo(map)
        .bindPopup(`Location: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`)
        .openPopup();
}

// Save a new location
function saveLocation(name, coords) {
    console.log('Saving location:', name, coords);
    
    const location = createLocation(name, coords);
    let isNewLocation = false;
    
    // Find if we already have a location with these coordinates
    const existingLocationIndex = savedLocations.findIndex(loc => loc.id === location.id);
    
    if (existingLocationIndex >= 0) {
        // Update existing location
        const existingLocation = savedLocations[existingLocationIndex];
        if (!existingLocation.names.includes(name)) {
            existingLocation.names.push(name);
            existingLocation.count++;
            existingLocation.date = new Date().toISOString();
        }
    } else {
        // Add new location
        savedLocations.push(location);
        isNewLocation = true;
    }
    
    // Save to localStorage
    saveToLocalStorage(savedLocations);
    
    // Update the map with all locations
    updateMapWithLocations();
    
    // If this is the first location, center the map on it
    if (isNewLocation && savedLocations.length === 1) {
        map.setView([coords.lat, coords.lng], 15);
    }
}

// Update the map with all saved locations
function updateMapWithLocations() {
    console.log('Updating map with locations...');
    console.log('Current saved locations:', savedLocations);
    
    // Make sure we have a valid map instance
    if (!map) {
        console.error('Cannot update map: map is not initialized');
        return;
    }
    
    // Make sure the location layer group exists
    if (!locationLayerGroup) {
        console.error('Cannot update map: location layer group is not initialized');
        return;
    }
    
    // Make sure groupLocationsById is available
    if (typeof groupLocationsById !== 'function') {
        console.error('groupLocationsById is not a function');
        return;
    }
    
    try {
        // Update the map with the current locations
        updateMap(map, savedLocations, locationLayerGroup);
        
        // Display saved locations in the sidebar
        displaySavedLocations();
    } catch (error) {
        console.error('Error updating map with locations:', error);
    }
}

// Display all saved locations in the sidebar
function displaySavedLocations() {
    const container = document.getElementById('savedLocations');
    if (!container) return;
    
    container.innerHTML = '<h4>Saved Locations:</h4>';
    
    if (savedLocations.length === 0) {
        container.innerHTML += '<p>No locations saved yet.</p>';
        return;
    }
    
    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';
    list.style.maxHeight = '300px';
    list.style.overflowY = 'auto';
    
    // Create a copy of the array to avoid mutating the original
    const sortedLocations = [...savedLocations].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedLocations.forEach(loc => {
        if (!loc || !loc.names) return;
        
        const item = document.createElement('li');
        item.style.padding = '10px';
        item.style.margin = '8px 0';
        item.style.background = '#fff';
        item.style.borderRadius = '4px';
        item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        item.style.borderLeft = `4px solid ${loc.count > 1 ? '#e74c3c' : '#3498db'}`;
        
        // Ensure names is an array before joining
        const locationNames = Array.isArray(loc.names) ? loc.names : [loc.names || 'Unnamed Location'];
        
        item.innerHTML = `
            <strong>${locationNames.join(', ')}</strong>
            ${loc.count > 1 ? `<span style="background: #e74c3c; color: white; border-radius: 10px; padding: 2px 6px; font-size: 0.8em; margin-left: 5px;">${loc.count}</span>` : ''}
            <div style="margin-top: 5px;">
                <small>${(loc.lat || 0).toFixed(2)}, ${(loc.lng || 0).toFixed(2)}</small><br>
                <small style="color: #666;">${loc.date || 'No date'}</small>
            </div>
        `;
        
        // Add click handler to fly to the location
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            if (loc.lat && loc.lng) {
                map.flyTo([loc.lat, loc.lng], 15);
                
                // Highlight the square by opening its popup
                if (window.locationSquares && Array.isArray(window.locationSquares)) {
                    const square = window.locationSquares.find(sq => 
                        sq && sq.getBounds && 
                        sq.getBounds().getCenter().lat === loc.lat && 
                        sq.getBounds().getCenter().lng === loc.lng
                    );
                    if (square && square.openPopup) {
                        square.openPopup();
                    }
                }
            }
        });
        
        list.appendChild(item);
    });
    
    container.appendChild(list);
}
