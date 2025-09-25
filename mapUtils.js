// Map Utilities
import { 
    getAverageColor, 
    getNeighborhoodColor
} from './locationUtils.js';

// Try to import groupLocationsById, fall back to global if not available
let groupLocationsById;

try {
    const utils = await import('./locationUtils.js');
    groupLocationsById = utils.groupLocationsById;
} catch (e) {
    console.warn('Could not import groupLocationsById, using global version');
    groupLocationsById = window.groupLocationsById;
}

// Draw a square on the map for a location
export function drawLocationSquare(map, location) {
    console.log('Drawing location square for:', location);
    
    // Parse the location ID to get the center coordinates
    const [centerLat, centerLng] = location.id.split('_').map(Number);
    const halfSize = 0.0005; // Half the size of the square in degrees
    
    // Define the bounds for the square
    const bounds = [
        [centerLat - halfSize, centerLng - halfSize],
        [centerLat + halfSize, centerLng + halfSize]
    ];
    
    console.log('Square bounds:', bounds);
    
    // Get the average color for all neighborhood names in this location
    const fillColor = getAverageColor(location.names);
    const borderColor = darkenColor(fillColor, 20); // Slightly darker border for better visibility
    
    const square = L.rectangle(bounds, {
        color: borderColor,
        weight: 1,
        fillColor: fillColor,
        fillOpacity: 0.7
    }).addTo(map);
    
    // Create popup content with all neighborhood names and their colors
    const popupContent = `
        <div style="min-width: 200px; max-height: 300px; overflow-y: auto;">
            <div style="margin-bottom: 8px; font-weight: bold;">
                ${location.names.length} Neighborhood${location.names.length > 1 ? 's' : ''}:
            </div>
            <ul style="margin: 0; padding-left: 20px; list-style: none;">
                ${location.names.map(name => `
                    <li style="margin: 4px 0; display: flex; align-items: center;">
                        <span style="
                            display: inline-block;
                            width: 12px;
                            height: 12px;
                            background-color: ${getNeighborhoodColor(name)};
                            margin-right: 8px;
                            border: 1px solid #333;
                        "></span>
                        ${name}
                    </li>
                `).join('')}
            </ul>
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee; font-size: 0.9em; color: #666;">
                <div>Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</div>
                <div>Last updated: ${new Date(location.date).toLocaleString()}</div>
            </div>
        </div>
    `;
    
    // Bind popup to the square
    square.bindPopup(popupContent);
    
    return square;
}

// Helper function to darken a color
function darkenColor(color, percent) {
    // Handle different color formats
    if (color.startsWith('hsl')) {
        // For HSL colors, adjust the lightness
        const match = color.match(/hsl\((\d+),\s*([\d.]+)%?,\s*([\d.]+)%?\)/);
        if (match) {
            const h = parseInt(match[1]);
            const s = parseFloat(match[2]);
            let l = parseFloat(match[3]);
            l = Math.max(0, l - percent);
            return `hsl(${h}, ${s}%, ${l}%)`;
        }
    } else if (color.startsWith('rgb')) {
        // For RGB colors, convert to HSL, adjust, then back to RGB
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (match) {
            const r = parseInt(match[1]) / 255;
            const g = parseInt(match[2]) / 255;
            const b = parseInt(match[3]) / 255;
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0; // achromatic
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            
            // Darken by reducing lightness
            l = Math.max(0, l - (percent / 100));
            
            // Convert back to RGB
            if (s === 0) {
                const val = Math.round(l * 255);
                return `rgb(${val}, ${val}, ${val})`;
            }
            
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
            
            const r2 = Math.round(hue2rgb(p, q, h + 1/3) * 255);
            const g2 = Math.round(hue2rgb(p, q, h) * 255);
            const b2 = Math.round(hue2rgb(p, q, h - 1/3) * 255);
            
            return `rgb(${r2}, ${g2}, ${b2})`;
        }
    }
    
    // Fallback: return the original color
    return color;
}

// Update the map with all saved locations
export function updateMapWithLocations(map, savedLocations, locationSquares) {
    console.log('updateMapWithLocations called');
    console.log('Map instance:', map);
    console.log('Saved locations:', savedLocations);
    console.log('Existing location squares:', locationSquares);
    
    if (!map) {
        console.error('Map instance is not available');
        return [];
    }
    
    // Clear existing markers and squares
    if (locationSquares && locationSquares.length > 0) {
        console.log(`Removing ${locationSquares.length} existing squares`);
        locationSquares.forEach((square, index) => {
            try {
                if (square && map.hasLayer(square)) {
                    map.removeLayer(square);
                    console.log(`Removed square ${index}`);
                }
            } catch (error) {
                console.error(`Error removing square ${index}:`, error);
            }
        });
    } else {
        console.log('No existing squares to remove');
    }
    
    // Group locations by ID and draw squares
    const groupedLocations = groupLocationsById(savedLocations);
    console.log(`Grouped ${savedLocations.length} locations into ${groupedLocations.length} groups`);
    
    const newSquares = [];
    
    if (groupedLocations.length > 0) {
        console.log('Drawing new squares...');
        
        groupedLocations.forEach((loc, index) => {
            try {
                console.log(`Drawing square ${index + 1}/${groupedLocations.length} for location:`, loc);
                const square = drawLocationSquare(map, loc);
                if (square) {
                    newSquares.push(square);
                    console.log(`Successfully added square ${index + 1}`);
                } else {
                    console.warn(`Failed to create square for location:`, loc);
                }
            } catch (error) {
                console.error(`Error drawing square for location ${loc.id}:`, error);
            }
        });
        
        // Fit bounds to show all locations if we have any
        if (newSquares.length > 0) {
            try {
                console.log('Fitting map bounds to show all squares');
                const group = L.featureGroup(newSquares);
                map.fitBounds(group.getBounds().pad(0.1));
                console.log('Map bounds updated');
            } catch (error) {
                console.error('Error fitting map bounds:', error);
            }
        } else {
            console.warn('No squares were created');
        }
    } else {
        console.log('No locations to display');
    }
    
    console.log(`Created ${newSquares.length} new squares`);
    return newSquares;
}
