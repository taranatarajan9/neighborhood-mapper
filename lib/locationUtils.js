'use client';

import supabase from './supabase';

// Cache for neighborhood colors
let neighborhoodColorsCache = {};

// Initialize colors from Supabase
export async function initNeighborhoodColors() {
  try {
    const { data, error } = await supabase
      .from('neighborhood_colors')
      .select('name, color');
    
    if (error) {
      console.error('Error fetching colors:', error);
      return {};
    }

    // Create a map of name -> color from the results
    const colors = {};
    if (data) {
      data.forEach(item => {
        colors[item.name] = item.color;
      });
      neighborhoodColorsCache = colors;
    }
    
    return colors;
  } catch (err) {
    console.error('Failed to initialize colors:', err);
    return {};
  }
}

// Generate a random color
function generateRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 60%)`; // Use HSL for better color distinction
}

// Get or create a color for a neighborhood name
export async function getNeighborhoodColor(name) {
  const lowerName = name.toLowerCase();
  
  // Check cache first
  if (neighborhoodColorsCache[lowerName]) {
    return neighborhoodColorsCache[lowerName];
  }

  // Check database
  const { data, error } = await supabase
    .from('neighborhood_colors')
    .select('color')
    .eq('name', lowerName)
    .single();

  if (!error && data) {
    neighborhoodColorsCache[lowerName] = data.color;
    return data.color;
  }

  // Generate new color if not found
  const newColor = generateRandomColor();
  neighborhoodColorsCache[lowerName] = newColor;

  // Save to database
  const { error: insertError } = await supabase
    .from('neighborhood_colors')
    .insert({ name: lowerName, color: newColor });

  if (insertError) {
    console.error('Failed to save color:', insertError);
  }

  return newColor;
}

// Get the average color synchronously (for UI rendering)
export function getAverageColorSync(names) {
  if (!names || names.length === 0) return '#cccccc';
  
  // Use cached colors where available
  const colors = names.map(name => {
    const lowerName = name.toLowerCase();
    return neighborhoodColorsCache[lowerName] || '#cccccc';
  });
  
  // Calculate average color
  return calculateAverageColor(colors);
}

// Calculate average of multiple colors
function calculateAverageColor(colors) {
  if (!colors || colors.length === 0) return '#cccccc';
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
export function groupLocationsById(locations) {
  const grouped = {};
  
  if (!locations || locations.length === 0) {
    return [];
  }
  
  locations.forEach(location => {
    // Skip invalid locations
    if (!location || !location.location_id) return;
    
    const id = location.location_id;
    
    if (!grouped[id]) {
      grouped[id] = {
        id: id,
        names: Array.isArray(location.names) ? [...location.names] : [],
        lat: parseFloat(location.lat) || 0,
        lng: parseFloat(location.lng) || 0,
        date: location.updated_at || location.created_at || new Date().toISOString(),
        count: parseInt(location.count) || 1
      };
    } else {
      // Merge names
      if (Array.isArray(location.names)) {
        location.names.forEach(name => {
          if (name && !grouped[id].names.includes(name)) {
            grouped[id].names.push(name);
          }
        });
      }
      grouped[id].count = grouped[id].names.length || 1;
      
      // Keep most recent date
      const locationDate = location.updated_at || location.created_at;
      if (locationDate && new Date(locationDate) > new Date(grouped[id].date)) {
        grouped[id].date = locationDate;
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
    location_id: locationId,
    names: [name],
    lat: roundedLat,
    lng: roundedLng,
    exact_lat: coords.lat,
    exact_lng: coords.lng,
    count: 1
  };
}

// Save location to Supabase
export async function saveLocation(location) {
  try {
    const { data, error } = await supabase
      .from('locations')
      .insert({
        location_id: location.location_id,
        names: location.names,
        lat: location.lat,
        lng: location.lng,
        exact_lat: location.exact_lat,
        exact_lng: location.exact_lng,
        count: location.count
      })
      .select();
      
    if (error) {
      console.error('Error saving location:', error);
      return null;
    }
    
    return data[0];
  } catch (err) {
    console.error('Failed to save location:', err);
    return null;
  }
}

// Load locations from Supabase
export async function loadLocations() {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000);
      
    if (error) {
      console.error('Error loading locations:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Failed to load locations:', err);
    return [];
  }
}

// Fetch all neighborhood names from the database
export async function fetchNeighborhoodNames() {
  try {
    const { data, error } = await supabase
      .from('neighborhood_colors')
      .select('name')
      .order('name');
      
    if (error) {
      console.error('Error fetching neighborhood names:', error);
      return [];
    }
    
    return data?.map(item => item.name) || [];
  } catch (err) {
    console.error('Failed to fetch neighborhood names:', err);
    return [];
  }
}

// Update an existing location
export async function updateLocation(locationId, updates) {
  try {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('location_id', locationId)
      .select();
      
    if (error) {
      console.error('Error updating location:', error);
      return null;
    }
    
    return data[0];
  } catch (err) {
    console.error('Failed to update location:', err);
    return null;
  }
}