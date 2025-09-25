// Location Utilities

// Round coordinates to the nearest thousandth (approximately 111m at the equator)
export function roundCoordinate(coord) {
    return Math.round(coord * 1000) / 1000;
}

// Generate a consistent ID based on rounded coordinates
export function getLocationId(lat, lng) {
    return `${roundCoordinate(lat)}_${roundCoordinate(lng)}`;
}

// Group locations by their ID
export function groupLocationsById(savedLocations) {
    const grouped = {};
    
    if (!savedLocations || savedLocations.length === 0) {
        return [];
    }
    
    savedLocations.forEach(location => {
        if (!location || !location.id) return;
        
        if (!grouped[location.id]) {
            grouped[location.id] = {
                id: location.id,
                names: Array.isArray(location.names) ? [...location.names] : [],
                lat: parseFloat(location.lat) || 0,
                lng: parseFloat(location.lng) || 0,
                date: location.date || new Date().toISOString(),
                count: parseInt(location.count) || 1
            };
        } else {
            if (Array.isArray(location.names)) {
                location.names.forEach(name => {
                    if (name && !grouped[location.id].names.includes(name)) {
                        grouped[location.id].names.push(name);
                    }
                });
            }
            grouped[location.id].count = grouped[location.id].names.length || 1;
            if (location.date && new Date(location.date) > new Date(grouped[location.id].date)) {
                grouped[location.id].date = location.date;
            }
        }
    });
    
    return Object.values(grouped).filter(loc => 
        loc && !isNaN(loc.lat) && !isNaN(loc.lng)
    );
}

// Create a location object
export function createLocation(name, coords) {
    const roundedLat = roundCoordinate(coords.lat);
    const roundedLng = roundCoordinate(coords.lng);
    const locationId = getLocationId(coords.lat, coords.lng);
    
    return {
        id: locationId,
        names: [name],
        lat: roundedLat,
        lng: roundedLng,
        exactLat: coords.lat,
        exactLng: coords.lng,
        date: new Date().toISOString(),
        count: 1
    };
}

// Save location to localStorage
export function saveToLocalStorage(locations) {
    localStorage.setItem('neighborhoodLocations', JSON.stringify(locations));
}

// Load locations from localStorage
export function loadFromLocalStorage() {
    const saved = localStorage.getItem('neighborhoodLocations');
    return saved ? JSON.parse(saved) : [];
}
