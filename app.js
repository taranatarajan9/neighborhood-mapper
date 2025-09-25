// Application state
let savedLocations = [];
let lastClickedCoords = null;

// DOM Elements
const locationForm = document.getElementById('locationForm');
const neighborhoodNameInput = document.getElementById('neighborhoodName');
const coordinatesDisplay = document.getElementById('coordinates');
const savedLocationsContainer = document.getElementById('savedLocations');

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet not loaded!');
        return;
    }
    
    // Initialize the map
    const map = L.map('map').setView([37.7749, -122.4194], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Add a marker
    const marker = L.marker([37.7749, -122.4194], {
        draggable: true
    }).addTo(map);
    
    // Handle map click
    map.on('click', function(e) {
        console.log('Map clicked at:', e.latlng);
        lastClickedCoords = e.latlng;
        marker.setLatLng(e.latlng);
        updateCoordinatesDisplay(e.latlng);
    });
    
    // Handle marker drag end
    marker.on('dragend', function(e) {
        const newLatLng = marker.getLatLng();
        lastClickedCoords = newLatLng;
        updateCoordinatesDisplay(newLatLng);
    });
    
    // Handle form submission
    if (locationForm) {
        locationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = neighborhoodNameInput.value.trim();
            
            if (!lastClickedCoords) {
                alert('Please click on the map to set a location first');
                return;
            }
            
            if (!name) {
                alert('Please enter a name for this location');
                return;
            }
            
            saveLocation({
                name: name,
                lat: lastClickedCoords.lat,
                lng: lastClickedCoords.lng,
                date: new Date().toISOString()
            });
            
            // Reset form
            neighborhoodNameInput.value = '';
            neighborhoodNameInput.focus();
        });
    }
    
    // Load saved locations
    loadSavedLocations();
    
    // Update coordinates display initially
    updateCoordinatesDisplay(marker.getLatLng());
    
    // Log map info
    console.log('Map initialized:', map);
    
    // Make map available globally for debugging
    window.map = map;
    window.marker = marker;
});

// Save a location
function saveLocation(location) {
    // Add to saved locations
    savedLocations.unshift({
        id: Date.now(),
        ...location
    });
    
    // Save to localStorage
    localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
    
    // Update the UI
    updateSavedLocations();
}

// Load saved locations from localStorage
function loadSavedLocations() {
    try {
        const saved = localStorage.getItem('savedLocations');
        if (saved) {
            savedLocations = JSON.parse(saved);
            updateSavedLocations();
        }
    } catch (error) {
        console.error('Error loading saved locations:', error);
    }
}

// Update the saved locations list
function updateSavedLocations() {
    if (!savedLocationsContainer) return;
    
    if (savedLocations.length === 0) {
        savedLocationsContainer.innerHTML = '<p class="no-locations">No locations saved yet</p>';
        return;
    }
    
    // Clear the container
    savedLocationsContainer.innerHTML = '';
    
    // Add each saved location
    savedLocations.forEach(location => {
        const locationElement = document.createElement('div');
        locationElement.className = 'location-item';
        locationElement.innerHTML = `
            <h5>${location.name}</h5>
            <p>${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</p>
        `;
        
        // Add click handler to center map on this location
        locationElement.addEventListener('click', () => {
            window.map.setView([location.lat, location.lng], 15);
            window.marker.setLatLng([location.lat, location.lng]);
            updateCoordinatesDisplay({ lat: location.lat, lng: location.lng });
        });
        
        savedLocationsContainer.appendChild(locationElement);
    });
}

// Update the coordinates display
function updateCoordinatesDisplay(latlng) {
    if (!coordinatesDisplay) return;
    
    coordinatesDisplay.textContent = 
        `Lat: ${latlng.lat.toFixed(6)}, Lng: ${latlng.lng.toFixed(6)}`;
}

// Debug function
window.debugMap = function() {
    console.log('=== Map Debug Info ===');
    console.log('Last clicked coords:', lastClickedCoords);
    console.log('Saved locations:', savedLocations);
    
    if (window.map) {
        console.log('Map center:', window.map.getCenter());
        console.log('Map zoom:', window.map.getZoom());
        window.map.invalidateSize();
    } else {
        console.log('Map not initialized');
    }
    
    console.log('=====================');
};


