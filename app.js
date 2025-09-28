// app.js

'use strict';

// top of app.js
import { updateMapWithLocations } from './mapUtils.js';
import { createLocation } from './locationUtils.js'; // <-- add this


let savedLocations = [];
let lastClickedCoords = null;

let locationForm = null;
let neighborhoodNameInput = null;
let coordinatesDisplay = null;
let savedLocationsContainer = null;

let map = null;                 // Leaflet map instance
let locationLayers = null;      // L.layerGroup() for saved locations
let marker = null;              // Draggable marker

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing application...');

  // Cache DOM
  locationForm = document.getElementById('locationForm');
  neighborhoodNameInput = document.getElementById('neighborhoodName');
  coordinatesDisplay = document.getElementById('coordinates');
  savedLocationsContainer = document.getElementById('savedLocations');

  if (typeof L === 'undefined') {
    console.error('Leaflet not loaded!');
    return;
  }

  // Map
  map = initMap();
  if (!map || !window.marker) {
    console.error('Failed to initialize map/marker');
    return;
  }
  console.log('map is initialized');

  // Events
  initEventListeners();

  loadSavedLocations();

  // Ensure proper sizing after initial render
  setTimeout(() => {
    if (map) map.invalidateSize(true);
  }, 100);
});

// ---- Map initialization ----
function initMap() {
  console.log('Initializing map...');

  const mapElement = document.getElementById('map');
  if (!mapElement) {
    console.error('Map container not found!');
    return null;
  }

  console.log('Map container found, dimensions:', {
    width: mapElement.offsetWidth,
    height: mapElement.offsetHeight,
    display: window.getComputedStyle(mapElement).display,
    visibility: window.getComputedStyle(mapElement).visibility,
    opacity: window.getComputedStyle(mapElement).opacity
  });

  // Create map
  window.map = L.map('map', {
    center: [37.7749, -122.4194],
    zoom: 13,
    zoomControl: false,
    preferCanvas: true,
    renderer: L.canvas(),
    trackResize: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    detectRetina: true
  }).addTo(window.map);

  L.control.zoom({ position: 'topright' }).addTo(window.map);

  // Layers & marker
  locationLayers = L.featureGroup().addTo(window.map);

  window.marker = L.marker([37.7749, -122.4194], {
    draggable: true,
    autoPan: true
  }).addTo(window.map);

  updateCoordinatesDisplay(window.marker.getLatLng());

  // Ensure map sizes correctly after render
  setTimeout(() => {
    if (window.map) window.map.invalidateSize(true);
  }, 100);

  console.log('Map initialized successfully');
  return window.map;
}

// ---- Events ----
function initEventListeners() {
  if (!window.map || !window.marker) return;

  // Click to move marker
  window.map.on('click', (e) => {
    console.log('Map clicked at:', e.latlng);
    window.marker.setLatLng(e.latlng); // ✅ moves the marker
    lastClickedCoords = e.latlng;
    updateCoordinatesDisplay(e.latlng);
  });

  // Drag marker to update coords
  window.marker.on('dragend', (e) => {
    const newLatLng = e.target.getLatLng();
    console.log('Marker dragged to:', newLatLng);
    lastClickedCoords = newLatLng;
    updateCoordinatesDisplay(newLatLng);
  });

  // Form submit
  if (locationForm) {
    locationForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (neighborhoodNameInput?.value || '').trim();
      if (!lastClickedCoords) {
        alert('Please click on the map to set a location first');
        return;
      }
      if (!name) {
        alert('Please enter a name for this location');
        return;
      }

      saveLocation({
        name,
        lat: lastClickedCoords.lat,
        lng: lastClickedCoords.lng,
        date: new Date().toISOString()
      });
      console.log("saved new location")

      neighborhoodNameInput.value = '';
      neighborhoodNameInput.focus();
    });
  }
}

// ---- Save & UI ----
function saveLocation({ name, lat, lng, date }) {
  const newLocation = createLocation(name, { lat, lng });
  // keep your date if provided
  if (date) newLocation.date = date;

  savedLocations.unshift(newLocation);
  localStorage.setItem('savedLocations', JSON.stringify(savedLocations));

  updateMapWithLocations(map, savedLocations, locationLayers);
  updateSavedLocations();
}


function updateSavedLocations() {
  if (!savedLocationsContainer) return;

  if (savedLocations.length === 0) {
    savedLocationsContainer.innerHTML = '<p class="no-locations">No locations saved yet</p>';
    return;
  }

  savedLocationsContainer.innerHTML = '';

  savedLocations.forEach((location) => {
    const el = document.createElement('div');
    el.className = 'location-item';
    el.innerHTML = `
      <h5>${location.name}</h5>
      <p>${Number(location.lat).toFixed(4)}, ${Number(location.lng).toFixed(4)}</p>
    `;
    el.addEventListener('click', () => {
      window.map.setView([location.lat, location.lng], 15);
      window.marker.setLatLng([location.lat, location.lng]);
      updateCoordinatesDisplay({ lat: location.lat, lng: location.lng });
      lastClickedCoords = { lat: location.lat, lng: location.lng };
    });
    savedLocationsContainer.appendChild(el);
  });
}

// ---- Persistence ----
function loadSavedLocations() {
  try {
    const saved = localStorage.getItem('savedLocations');
    console.log("updating map with stored locations")
    if (saved) {
      savedLocations = JSON.parse(saved) || [];
      if (locationLayers) locationLayers.clearLayers();
      updateMapWithLocations(window.map, savedLocations, locationLayers);
      updateSavedLocations();
    }
  } catch (err) {
    console.error('Error loading saved locations:', err);
  }
}

// ---- Helpers ----
function updateCoordinatesDisplay(latlng) {
  if (!coordinatesDisplay || !latlng) return;
  coordinatesDisplay.textContent =
    `Lat: ${Number(latlng.lat).toFixed(6)}, Lng: ${Number(latlng.lng).toFixed(6)}`;
}

// ---- Debug ----
window.debugMap = function () {
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
