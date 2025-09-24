// Store the last clicked coordinates
let lastClickedCoords = null;

// Initialize the map when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Neighborhood Mapper app initialized');
    
    // Initialize the map centered on San Francisco
    const map = L.map('map').setView([37.7749, -122.4194], 12);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
    
    // Store for saved locations
    let savedLocations = JSON.parse(localStorage.getItem('neighborhoodLocations')) || [];
    
    // Save a new location
    function saveLocation(name, coords) {
        const location = {
            id: Date.now(),
            name: name,
            lat: coords.lat,
            lng: coords.lng,
            date: new Date().toLocaleString()
        };
        
        savedLocations.push(location);
        localStorage.setItem('neighborhoodLocations', JSON.stringify(savedLocations));
        
        // Update the marker popup with the name
        currentMarker.setPopupContent(`<b>${name}</b><br>(${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
    }
    
    // Display all saved locations
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
        
        savedLocations.forEach(loc => {
            const item = document.createElement('li');
            item.style.padding = '8px';
            item.style.margin = '5px 0';
            item.style.background = '#fff';
            item.style.borderRadius = '4px';
            item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            
            item.innerHTML = `
                <strong>${loc.name}</strong><br>
                <small>${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}</small><br>
                <small style="color: #666;">${loc.date}</small>
            `;
            
            // Add click handler to fly to the location
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                map.flyTo([loc.lat, loc.lng], 15);
                
                // Update the current marker
                if (currentMarker) {
                    map.removeLayer(currentMarker);
                }
                
                currentMarker = L.marker([loc.lat, loc.lng])
                    .addTo(map)
                    .bindPopup(`<b>${loc.name}</b><br>(${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`)
                    .openPopup();
            });
            
            list.appendChild(item);
        });
        
        container.appendChild(list);
    }
    
    // Initialize the map click handler
    map.on('click', onMapClick);
    
    // Display any saved locations on load
    displaySavedLocations();
});

