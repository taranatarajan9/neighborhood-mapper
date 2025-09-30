'use client';

import {
  getAverageColorSync,
  getNeighborhoodColor
} from './locationUtils';

// Draw a square on the map for a location
export function drawLocationSquare(location, L) {
  // First try to use the id property, then fallback to location_id
  const locationId = location.id || location.location_id;
  console.log(`Drawing location with ID: ${locationId}`);
  
  const [centerLat, centerLng] = locationId.split('_').map(Number);
  const halfSize = 0.0005;

  const bounds = [
    [centerLat - halfSize, centerLng - halfSize],
    [centerLat + halfSize, centerLng + halfSize],
  ];

  // Use the synchronous version for UI rendering to avoid blocking
  const fillColor = getAverageColorSync(location.names);

  // Create layer but DON'T add directly to map here
  const square = L.rectangle(bounds, {
    color: fillColor,
    weight: 0.1,
    fillColor: fillColor,
    fillOpacity: 0.7,
  });

  // Create popup content with neighborhood names and percentages
  // We'll need to handle async color loading differently
  const createPopupContent = async () => {
    const namesWithColors = await Promise.all(
      location.names.map(async (name) => {
        const color = await getNeighborhoodColor(name);
        return { name, color };
      })
    );

    // Count occurrences of each neighborhood name
    const nameCount = {};
    location.names.forEach(name => {
      nameCount[name] = (nameCount[name] || 0) + 1;
    });

    // Calculate percentages
    const namesWithPercentages = namesWithColors.map(({ name, color }) => {
      const count = nameCount[name] || 0;
      const percentage = Math.round((count / location.names.length) * 100);
      return { name, color, percentage };
    });

    // Remove duplicates and sort by percentage (highest first)
    const uniqueEntries = [];
    const processedNames = new Set();
    
    namesWithPercentages.forEach(entry => {
      if (!processedNames.has(entry.name)) {
        processedNames.add(entry.name);
        uniqueEntries.push(entry);
      }
    });
    
    uniqueEntries.sort((a, b) => b.percentage - a.percentage);

    return `
      <div style="min-width: 200px; max-height: 300px; overflow-y: auto;">
        <div style="margin-bottom: 8px; font-weight: bold;">
          ${location.names.length} Neighborhood${location.names.length > 1 ? 's' : ''}:
        </div>
        <ul style="margin: 0; padding-left: 20px; list-style: none;">
          ${uniqueEntries.map(({ name, color, percentage }) => `
            <li style="margin: 4px 0; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center;">
                <span style="
                  display: inline-block;
                  width: 12px;
                  height: 12px;
                  background-color: ${color};
                  margin-right: 8px;
                  border: 1px solid #333;
                "></span>
                ${name}
              </div>
              <span style="margin-left: 10px; font-weight: bold;">${percentage}%</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  };
  
  // Handle popup opening
  square.on('popupopen', async (e) => {
    const popup = e.popup;
    const content = await createPopupContent();
    popup.setContent(content);
    popup.update();
  });
  
  // Initial popup binding with loading message
  square.bindPopup(`<div>Loading neighborhood information...</div>`);
  
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
export function updateMapWithLocations(map, locations, locationLayerGroup, L) {
  if (!map || !locationLayerGroup) return;

  locationLayerGroup.clearLayers();

  // Group locations by their ID for display
  import('./locationUtils').then(({ groupLocationsById }) => {
    // Log total number of locations before grouping
    console.log(`Total locations before grouping: ${locations.length}`);
    
    const groupedLocations = groupLocationsById(locations);
    
    // Log number of locations after grouping
    console.log(`Unique location groups after grouping: ${groupedLocations.length}`);
    
    groupedLocations.forEach((loc) => {
      // Log location details for debugging
      console.log(`Drawing location: ${loc.id}, names: ${loc.names.join(', ')}`);
      
      const square = drawLocationSquare(loc, L);
      // Add to the group (the group is already on the map)
      square.addTo(locationLayerGroup);
    });
  });
}