// Location Utilities

// Store neighborhood colors
let neighborhoodColors = JSON.parse(localStorage.getItem('neighborhoodColors')) || {};

// Generate a random color
function generateRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`; // Use HSL for better color distinction
}

// Get or create a color for a neighborhood name
export function getNeighborhoodColor(name) {
    const lowerName = name.toLowerCase();
    if (!neighborhoodColors[lowerName]) {
        neighborhoodColors[lowerName] = generateRandomColor();
        // Save to localStorage
        localStorage.setItem('neighborhoodColors', JSON.stringify(neighborhoodColors));
    }
    return neighborhoodColors[lowerName];
}

// Get the average color of multiple neighborhood colors
export function getAverageColor(names) {
    if (!names || names.length === 0) return '#cccccc';
    
    // Convert all names to colors
    const colors = names.map(name => getNeighborhoodColor(name));
    
    // If only one color, return it directly
    if (colors.length === 1) return colors[0];
    
    // Convert colors to RGB and calculate average
    let r = 0, g = 0, b = 0, count = 0;
    
    colors.forEach(color => {
        // Handle both hex and hsl colors
        if (color.startsWith('hsl')) {
            const hsl = color.match(/\d+/g);
            if (hsl && hsl.length >= 3) {
                const rgb = hslToRgb(
                    parseInt(hsl[0]) / 360,
                    parseInt(hsl[1]) / 100,
                    parseInt(hsl[2]) / 100
                );
                r += rgb.r;
                g += rgb.g;
                b += rgb.b;
                count++;
            }
        } else {
            // Handle hex colors
            const hex = color.replace('#', '');
            const bigint = parseInt(hex, 16);
            r += (bigint >> 16) & 255;
            g += (bigint >> 8) & 255;
            b += bigint & 255;
            count++;
        }
    });
    
    // Calculate average
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    
    return `rgb(${r}, ${g}, ${b})`;
}

// Helper function to convert HSL to RGB
function hslToRgb(h, s, l) {
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

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
    console.log('groupLocationsById called with:', savedLocations);
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
