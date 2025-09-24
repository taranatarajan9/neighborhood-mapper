// Initialize the map when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Neighborhood Mapper app initialized');
    
    // Initialize the map centered on San Francisco
    const map = L.map('map').setView([37.7749, -122.4194], 12);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add a marker at Union Square
    var marker = L.marker([37.7879, -122.4074]).addTo(map)
        .bindPopup('Union Square, San Francisco')
        .openPopup();

    // Add click event handler to the map
    function onMapClick(e) {
        alert("You clicked the map at " + e.latlng);
    }

    map.on('click', onMapClick);
});

