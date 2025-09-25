// Map Utilities

// Draw a square on the map for a location
export function drawLocationSquare(map, location) {
    // Parse the location ID to get the center coordinates
    const [centerLat, centerLng] = location.id.split('_').map(Number);
    const halfSize = 0.0005; // Half the size of the square in degrees
    
    // Define the bounds for the square
    const bounds = [
        [centerLat - halfSize, centerLng - halfSize],
        [centerLat + halfSize, centerLng + halfSize]
    ];
    
    // Create a colored rectangle
    const color = location.count > 1 ? '#e74c3c' : '#3498db';
    
    const square = L.rectangle(bounds, {
        color: color,
        weight: 1,
        fillColor: color,
        fillOpacity: 0.5
    }).addTo(map);
    
    // Create popup content with all neighborhood names
    const popupContent = `
        <div style="min-width: 200px; max-height: 300px; overflow-y: auto;">
            <div style="margin-bottom: 8px; font-weight: bold;">
                ${location.names.length} Neighborhood${location.names.length > 1 ? 's' : ''}:
            </div>
            <ul style="margin: 0; padding-left: 20px;">
                ${location.names.map(name => `<li>${name}</li>`).join('')}
            </ul>
            <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
                ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}<br>
                Last updated: ${new Date(location.date).toLocaleString()}
            </div>
        </div>
    `;
    
    // Bind popup to the square
    square.bindPopup(popupContent);
    
    return square;
}

// Update the map with all saved locations
export function updateMapWithLocations(map, savedLocations, locationSquares) {
    console.log('Updating map with locations...');
    
    // Clear existing markers and squares
    if (locationSquares) {
        locationSquares.forEach(square => {
            if (square && map.hasLayer(square)) {
                map.removeLayer(square);
            }
        });
    }
    
    // Group locations by ID and draw squares
    const groupedLocations = groupLocationsById(savedLocations);
    console.log('Grouped locations:', groupedLocations);
    
    const newSquares = [];
    groupedLocations.forEach(loc => {
        try {
            const square = drawLocationSquare(map, loc);
            if (square) {
                newSquares.push(square);
            }
        } catch (error) {
            console.error('Error drawing square:', error);
        }
    });
    
    // Fit bounds to show all locations if we have any
    if (newSquares.length > 0) {
        const group = L.featureGroup(newSquares);
        map.fitBounds(group.getBounds().pad(0.1));
    }
    
    return newSquares;
}
