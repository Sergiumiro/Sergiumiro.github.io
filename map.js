// Initialize the map
function initializeMap() {
    // Create map centered on Yekaterinburg Expo Hall area
    map = L.map('map').setView([56.835, 60.605], 15);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add hall markers to the map
    addHallMarkers();
    
    // Set up map events
    setupMapEvents();
}

function addHallMarkers() {
    // Define hall coordinates based on the venue layout
    // These are estimated coordinates for halls in the COMIC-CON venue
    const halls = {
        // C halls
        'C2': [56.836, 60.602],
        'C4': [56.836, 60.604],
        'C5': [56.836, 60.605],
        'C11': [56.836, 60.607],
        'C14': [56.836, 60.608],
        'C15': [56.836, 60.609],
        'C18': [56.836, 60.610],
        'C19': [56.836, 60.611],
        'C20': [56.836, 60.612],
        'C21': [56.836, 60.613],
        
        // F halls
        'F1': [56.834, 60.602],
        'F2': [56.834, 60.603],
        'F3': [56.834, 60.604],
        'F4': [56.834, 60.605],
        'F5': [56.834, 60.606],
        
        // H halls
        'H1': [56.837, 60.603],
        'H2': [56.837, 60.604],
        
        // B halls
        'B2': [56.833, 60.602],
        'B3': [56.833, 60.603],
        'B4': [56.833, 60.604],
        'B5': [56.833, 60.605],
        'B6': [56.833, 60.606],
        'B7': [56.833, 60.607],
        'B8': [56.833, 60.608],
        'B9': [56.833, 60.609],
        'B10': [56.833, 60.610],
        'B11': [56.833, 60.611],
        'B12': [56.833, 60.612],
        'B13': [56.833, 60.613],
        'B14': [56.833, 60.614],
        'B15': [56.833, 60.615],
        'B16': [56.833, 60.616],
        'B17': [56.833, 60.617],
        'B18': [56.833, 60.618],
        'B19': [56.833, 60.619],
        'B20': [56.833, 60.620],
        
        // m halls
        'm1': [56.835, 60.601],
        'm2': [56.835, 60.602],
        'm3': [56.835, 60.603],
        'm4': [56.835, 60.604],
        'm5': [56.835, 60.605],
        'm6': [56.835, 60.606],
        'm7': [56.835, 60.607],
        'm8': [56.835, 60.608],
        'm9': [56.835, 60.609],
        'm10': [56.835, 60.610],
        'm11': [56.835, 60.611],
        'm12': [56.835, 60.612],
        'm13': [56.835, 60.613],
        'm14': [56.835, 60.614],
        'm15': [56.835, 60.615],
        'm16': [56.835, 60.616],
        'm17': [56.835, 60.617],
        'm18': [56.835, 60.618],
        'm19': [56.835, 60.619],
        'm20': [56.835, 60.620],
        'm21': [56.835, 60.621],
        'm22': [56.835, 60.622],
        'm23': [56.835, 60.623],
        'm24': [56.835, 60.624],
        'm25': [56.835, 60.625],
        'm26': [56.835, 60.626],
        'm27': [56.835, 60.627],
        'm28': [56.835, 60.628],
        'm29': [56.835, 60.629],
        'm30': [56.835, 60.630],
        'm31': [56.835, 60.631],
        'm32': [56.835, 60.632],
        'm33': [56.835, 60.633],
        'm34': [56.835, 60.634],
        'm35': [56.835, 60.635],
        'm36': [56.835, 60.636]
    };

    // Create markers for each hall
    for (const [hallName, coords] of Object.entries(halls)) {
        const marker = L.marker(coords, {
            title: `Зал ${hallName}`
        }).addTo(map);
        
        // Add popup with hall name
        marker.bindPopup(`<b>Зал ${hallName}</b><br>Нажмите для просмотра событий`);
        
        // Store marker reference
        markers[hallName] = marker;
        
        // Add click event to show hall events
        marker.on('click', function(e) {
            showHallEvents(hallName);
            triggerHapticFeedback();
        });
    }
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
            const eventStart = new Date(event.start);
            const timeString = `${eventStart.getHours().toString().padStart(2, '0')}:${eventStart.getMinutes().toString().padStart(2, '0')}`;
            
            // Check if event is current
            const eventEnd = new Date(event.end);
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
    map.on('click', function(e) {
        document.getElementById('infoPanel').classList.remove('active');
    });
    
    // Add zoom controls
    map.addControl(L.control.zoom({ position: 'bottomright' }));
    
    // Add scale control
    L.control.scale({ imperial: false }).addTo(map);
}

// Function to update markers based on current events
function updateMarkers() {
    const now = new Date();
    
    for (const [hallName, marker] of Object.entries(markers)) {
        // Find current or upcoming events in this hall
        const hallEvents = events.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            
            // Check if event is current or starts within 30 minutes
            return event.hall === hallName && 
                   (now >= eventStart && now <= eventEnd) || 
                   (eventStart > now && eventStart <= new Date(now.getTime() + 30 * 60 * 1000));
        });
        
        // Change marker color if there are events
        if (hallEvents.length > 0) {
            // In a real implementation, we would change the marker icon
            // For now, we'll just log this
            console.log(`Hall ${hallName} has ${hallEvents.length} events`);
        }
    }
}

// Make updateMarkers available globally
window.updateMarkers = updateMarkers;