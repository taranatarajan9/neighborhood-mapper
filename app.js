// Store the last clicked coordinates
let lastClickedCoords = null;

// Initialize the map when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Make sure the map container has a height
    const mapElement = document.getElementById('map');
    if (!mapElement.style.height) {
        mapElement.style.height = '600px';
    }
    console.log('Neighborhood Mapper app initialized');
    
    // Initialize the map centered on San Francisco
    const map = L.map('map', {
        center: [37.7749, -122.4194],
        zoom: 12,
        zoomControl: true
    });
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        detectRetina: true
    }).addTo(map);
    
    // Add zoom control
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
    
    // Variable to store the current marker
    let currentMarker = L.marker([37.7879, -122.4074]).addTo(map)
        .bindPopup('Union Square, San Francisco')
        .openPopup();

    // Add click event handler to the map
    function onMapClick(e) {
        // Store the clicked coordinates
        lastClickedCoords = e.latlng;
        
        // Remove the existing marker if it exists
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        
        // Add a new marker at the clicked location
        currentMarker = L.marker(e.latlng).addTo(map)
            .bindPopup(`Location: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`)
            .openPopup();
            
        console.log('Marker added at:', e.latlng);
        
        // Focus the input field
        document.getElementById('neighborhoodName').focus();
    }

    // Handle form submission
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
        
        // Update the displayed locations
        displaySavedLocations();
    });
    
    let savedLocations = JSON.parse(localStorage.getItem('neighborhoodLocations')) || [];
    
    // Round coordinates to the nearest thousandth (approximately 111m at the equator)
    function roundCoordinate(coord) {
        return Math.round(coord * 1000) / 1000;
    }

    // Generate a consistent ID based on rounded coordinates
    function getLocationId(lat, lng) {
        return `${roundCoordinate(lat)}_${roundCoordinate(lng)}`;
    }

    // Save a new location
    function saveLocation(name, coords) {
        const roundedLat = roundCoordinate(coords.lat);
        const roundedLng = roundCoordinate(coords.lng);
        const locationId = getLocationId(coords.lat, coords.lng);
        
        // Find if we already have a location with these rounded coordinates
        const existingLocationIndex = savedLocations.findIndex(loc => loc.id === locationId);
        
        const location = {
            id: locationId,
            names: [name],  // Store multiple names in an array
            lat: roundedLat,
            lng: roundedLng,
            exactLat: coords.lat,
            exactLng: coords.lng,
            date: new Date().toLocaleString(),
            count: 1
        };
        
        if (existingLocationIndex >= 0) {
            // Update existing location with new name if it's not already in the list
            const existingLocation = savedLocations[existingLocationIndex];
            if (!existingLocation.names.includes(name)) {
                existingLocation.names.push(name);
                existingLocation.count++;
                existingLocation.date = new Date().toLocaleString();
            }
        } else {
            savedLocations.push(location);
        }
        
        localStorage.setItem('neighborhoodLocations', JSON.stringify(savedLocations));
        
        // Update the map with all locations
        updateMapWithLocations();
    }
    
    // Draw a square on the map for a location
    function drawLocationSquare(location) {
        // Parse the location ID to get the center coordinates
        const [centerLat, centerLng] = location.id.split('_').map(Number);
        const halfSize = 0.0005; // Half the size of the square in degrees
        
        // Define the bounds for the square
        const bounds = [
            [centerLat - halfSize, centerLng - halfSize],
            [centerLat + halfSize, centerLng + halfSize]
        ];
        
        // Create a colored rectangle
        const color = location.count > 1 ? '#e74c3c' : '#3498db'; // Red for multiple locations, blue for single
        
        const square = L.rectangle(bounds, {
            color: color,
            weight: 1,
            fillColor: color,
            fillOpacity: 0.5
        }).addTo(map);
        
        // Create popup content
        const popupContent = `
            <div style="min-width: 150px;">
                <strong>${location.names.join(', ')}</strong><br>
                <small>${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}</small><br>
                <small>Locations: ${location.count}</small><br>
                <small>Last updated: ${location.date}</small>
            </div>
        `;
        
        // Bind popup to the square
        square.bindPopup(popupContent);
        
        return square;
    }
    
    // Update the map with all saved locations
    function updateMapWithLocations() {
        // Clear existing markers and squares
        if (window.locationSquares) {
            window.locationSquares.forEach(square => map.removeLayer(square));
        }
        
        // Draw new squares for each location
        window.locationSquares = savedLocations.map(loc => drawLocationSquare(loc));
    }
    
    // Display all saved locations in the sidebar
    function displaySavedLocations() {
        const container = document.getElementById('savedLocations');
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
        
        savedLocations.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by most recent
        
        savedLocations.forEach(loc => {
            const item = document.createElement('li');
            item.style.padding = '10px';
            item.style.margin = '8px 0';
            item.style.background = '#fff';
            item.style.borderRadius = '4px';
            item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            item.style.borderLeft = `4px solid ${loc.count > 1 ? '#e74c3c' : '#3498db'}`;
            
            item.innerHTML = `
                <strong>${loc.names.join(', ')}</strong>
                ${loc.count > 1 ? `<span style="background: #e74c3c; color: white; border-radius: 10px; padding: 2px 6px; font-size: 0.8em; margin-left: 5px;">${loc.count}</span>` : ''}
                <div style="margin-top: 5px;">
                    <small>${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)}</small><br>
                    <small style="color: #666;">${loc.date}</small>
                </div>
            `;
            
            // Add click handler to fly to the location
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                map.flyTo([loc.lat, loc.lng], 15);
                
                // Highlight the square by opening its popup
                const square = window.locationSquares.find(sq => 
                    sq.getBounds().getCenter().lat === loc.lat && 
                    sq.getBounds().getCenter().lng === loc.lng
                );
                if (square) square.openPopup();
            });
            
            list.appendChild(item);
        });
        
        container.appendChild(list);
    }
    
    // Initialize the map click handler
    map.on('click', onMapClick);
    
    // Display any saved locations on load and update the map
    displaySavedLocations();
    updateMapWithLocations();
    
    // Make sure the map fits all squares when loaded
    if (savedLocations.length > 0) {
        const group = new L.featureGroup(window.locationSquares || []);
        map.fitBounds(group.getBounds().pad(0.1));
    }
});
