// Initialize the map
function initializeMap() {
    // Create static image map with overlay points
    const mapContainer = document.getElementById('map');
    
    // Set up the static map image
    mapContainer.style.position = 'relative';
    mapContainer.style.width = '100%';
    mapContainer.style.height = '100%';
    mapContainer.style.objectFit = 'contain';
    
    // Add hall markers to the map
    addHallMarkers();
    
    // Set up map events
    setupMapEvents();
}

function addHallMarkers() {
    // Clear any existing markers
    const existingMarkers = document.querySelectorAll('.map-point');
    existingMarkers.forEach(marker => marker.remove());
    
    // For each event, create map points based on mapPoints
    events.forEach(event => {
        if (event.mapPoints && event.mapPoints.length > 0) {
            event.mapPoints.forEach((point, index) => {
                // Create a marker element
                const marker = document.createElement('div');
                marker.className = 'map-point';
                marker.dataset.eventId = event.id;
                marker.dataset.pointIndex = index;
                
                // Set position based on normalized coordinates (0-1)
                // Convert to percentage positions
                marker.style.position = 'absolute';
                marker.style.left = `${point.x * 100}%`;
                marker.style.top = `${point.y * 100}%`;
                marker.style.transform = 'translate(-50%, -50%)';
                marker.style.width = '12px';
                marker.style.height = '12px';
                marker.style.backgroundColor = '#3498db';
                marker.style.border = '2px solid white';
                marker.style.borderRadius = '50%';
                marker.style.cursor = 'pointer';
                marker.style.zIndex = '1000';
                marker.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
                
                // Add tooltip
                marker.title = `${point.label || `Зал ${event.hall}`}`;
                
                // Add click event
                marker.addEventListener('click', function(e) {
                    e.stopPropagation();
                    selectEvent(event);
                    triggerHapticFeedback();
                });
                
                // Add to map container
                document.getElementById('map').appendChild(marker);
                
                // Store reference to marker
                if (!markers[event.id]) {
                    markers[event.id] = [];
                }
                markers[event.id].push(marker);
            });
        }
    });
}

function showHallEvents(hallName) {
    // Find events in this hall
    const hallEvents = events.filter(event => event.hall === hallName);
    
    if (hallEvents.length > 0) {
        // Show upcoming events in info panel
        const infoPanel = document.getElementById('infoPanel');
        const infoTitle = document.getElementById('infoTitle');
        const infoContent = document.getElementById('infoContent');
        
        infoTitle.textContent = `Зал ${hallName}`;
        
        let eventsHtml = '<h4>События в зале:</h4><ul>';
        const now = new Date();
        
        hallEvents.forEach(event => {
            const eventStart = new Date(event.startTime);
            const timeString = `${eventStart.getHours().toString().padStart(2, '0')}:${eventStart.getMinutes().toString().padStart(2, '0')}`;
            
            // Check if event is current
            const eventEnd = new Date(event.endTime);
            const isCurrent = now >= eventStart && now <= eventEnd;
            const isSoon = eventStart > now && eventStart <= new Date(now.getTime() + 30 * 60 * 1000);
            
            const statusClass = isCurrent ? 'current' : isSoon ? 'soon' : '';
            const statusText = isCurrent ? ' (Идет сейчас)' : isSoon ? ' (Скоро начнется)' : '';
            
            eventsHtml += `<li class="${statusClass}"><strong>${timeString}</strong> ${event.title}${statusText}</li>`;
        });
        
        eventsHtml += '</ul>';
        infoContent.innerHTML = eventsHtml;
        
        infoPanel.classList.add('active');
    } else {
        // Show just the hall name
        showEventDetails({
            title: `Зал ${hallName}`,
            description: 'В этом зале пока нет запланированных событий',
            hall: hallName
        });
    }
}

function setupMapEvents() {
    // Add map click event to hide info panel
    document.getElementById('map').addEventListener('click', function(e) {
        // Only hide if clicking directly on the map, not on a marker
        if (e.target.id === 'map') {
            document.getElementById('infoPanel').classList.remove('active');
        }
    });
}

// Function to update markers based on current events
function updateMarkers() {
    const now = new Date();
    
    // Reset all markers to default state
    document.querySelectorAll('.map-point').forEach(marker => {
        marker.style.backgroundColor = '#3498db';
        marker.style.width = '12px';
        marker.style.height = '12px';
        marker.style.transform = 'translate(-50%, -50%)';
    });
    
    // Highlight markers for events that are current or upcoming within 30 minutes
    events.forEach(event => {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        
        // Check if event is current or starts within 30 minutes
        const isCurrent = now >= eventStart && now <= eventEnd;
        const isSoon = eventStart > now && eventStart <= new Date(now.getTime() + 30 * 60 * 1000);
        
        if (isCurrent || isSoon) {
            // Highlight the map points for this event
            if (markers[event.id] && markers[event.id].length > 0) {
                markers[event.id].forEach(marker => {
                    marker.style.backgroundColor = isCurrent ? '#e74c3c' : '#f39c12'; // Red for current, orange for upcoming
                    marker.style.width = '14px';
                    marker.style.height = '14px';
                    marker.style.transform = 'translate(-50%, -50%) scale(1.1)';
                    marker.style.zIndex = '1001';
                });
            }
        }
    });
}

// Make updateMarkers available globally
window.updateMarkers = updateMarkers;