// Global variables
let events = [];
let map = null;
let markers = {};
let currentMarker = null;
let telegramWebApp = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Telegram WebApp
    initializeTelegramWebApp();
    
    // Load events and initialize map
    await loadEvents();
    initializeMap();
    
    // Start periodic update for current events
    setInterval(updateCurrentEvents, 60000); // Update every minute
    
    // Set up responsive layout
    setupResponsiveLayout();
});

function initializeTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        telegramWebApp = window.Telegram.WebApp;
        telegramWebApp.ready();
        
        // Apply theme to the app
        if (telegramWebApp.themeParams) {
            applyTheme(telegramWebApp.themeParams);
        }
    }
}

function applyTheme(themeParams) {
    const bgColor = themeParams.bg_color || '#ffffff';
    const textColor = themeParams.text_color || '#000000';
    const hintColor = themeParams.hint_color || '#999999';
    
    document.body.style.backgroundColor = bgColor;
    document.body.style.color = textColor;
    
    // Apply theme to header
    const header = document.querySelector('.header');
    if (header) {
        header.style.backgroundColor = themeParams.accent_text_color || '#2c3e50';
        header.style.color = themeParams.header_bg_color ? 
            (themeParams.text_color || '#ffffff') : 
            (themeParams.bg_color || '#ffffff');
    }
}

async function loadEvents() {
    try {
        const response = await fetch('./events.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        events = await response.json();
        
        // Sort events by start time
        events.sort((a, b) => new Date(a.start) - new Date(b.start));
        
        // Display events
        displayEvents(events);
        
        // Hide loading indicator
        document.getElementById('loading').style.display = 'none';
        document.getElementById('eventsContainer').style.display = 'block';
        
        console.log('Events loaded successfully:', events.length);
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('loading').innerHTML = '<div class="error">Ошибка загрузки событий. Проверьте подключение к интернету.</div>';
        
        // Retry after 5 seconds
        setTimeout(loadEvents, 5000);
    }
}

function displayEvents(events) {
    const container = document.getElementById('eventsContainer');
    container.innerHTML = '';
    
    events.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.dataset.id = event.id;
        
        // Format time
        const startTime = new Date(event.start);
        const endTime = new Date(event.end);
        const timeString = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}–${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
        
        eventElement.innerHTML = `
            <div class="event-title">${event.title}</div>
            <div class="event-time">${timeString}</div>
            <div class="event-hall">Зал: ${event.hall}</div>
        `;
        
        eventElement.addEventListener('click', () => {
            selectEvent(event);
            triggerHapticFeedback();
        });
        
        container.appendChild(eventElement);
    });
}

function updateCurrentEvents() {
    const now = new Date();
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);
    
    // Clear current highlights
    document.querySelectorAll('.event-item').forEach(el => {
        el.classList.remove('current');
    });
    
    // Check each event
    events.forEach(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // Check if event starts within the next 30 minutes
        if (eventStart >= now && eventStart <= thirtyMinutesLater) {
            const eventElement = document.querySelector(`.event-item[data-id="${event.id}"]`);
            if (eventElement) {
                eventElement.classList.add('current');
            }
        }
        
        // Also highlight ongoing events
        if (now >= eventStart && now <= eventEnd) {
            const eventElement = document.querySelector(`.event-item[data-id="${event.id}"]`);
            if (eventElement) {
                eventElement.classList.add('current');
            }
        }
    });
}

function selectEvent(event) {
    // Fly to the event location on the map
    flyToHall(event.hall);
    
    // Show event details in info panel
    showEventDetails(event);
    
    // Highlight the selected event
    document.querySelectorAll('.event-item').forEach(el => {
        el.classList.remove('selected');
    });
    const selectedElement = document.querySelector(`.event-item[data-id="${event.id}"]`);
    if (selectedElement) {
        selectedElement.classList.add('selected');
    }
}

function flyToHall(hallName) {
    if (markers[hallName]) {
        // Remove pulse from current marker if exists
        if (currentMarker) {
            currentMarker.getElement().classList.remove('pulse-marker');
        }
        
        // Fly to the hall
        const latLng = markers[hallName].getLatLng();
        map.flyTo(latLng, 16, { animate: true, duration: 1.5 });
        
        // Add pulse effect to the marker
        setTimeout(() => {
            markers[hallName].getElement().classList.add('pulse-marker');
            currentMarker = markers[hallName];
            
            // Remove pulse after animation completes
            setTimeout(() => {
                if (currentMarker === markers[hallName]) {
                    markers[hallName].getElement().classList.remove('pulse-marker');
                    currentMarker = null;
                }
            }, 1500);
        }, 1000);
    }
}

function showEventDetails(event) {
    const infoPanel = document.getElementById('infoPanel');
    const infoTitle = document.getElementById('infoTitle');
    const infoContent = document.getElementById('infoContent');
    
    const startTime = new Date(event.start);
    const endTime = new Date(event.end);
    const timeString = `${startTime.toLocaleDateString()} ${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}–${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
    
    infoTitle.textContent = event.title;
    infoContent.innerHTML = `
        <p><strong>Время:</strong> ${timeString}</p>
        <p><strong>Зал:</strong> ${event.hall}</p>
        <p><strong>Описание:</strong> ${event.description || 'Нет описания'}</p>
    `;
    
    infoPanel.classList.add('active');
}

function triggerHapticFeedback() {
    if (telegramWebApp && telegramWebApp.HapticFeedback) {
        try {
            telegramWebApp.HapticFeedback.impactOccurred('light');
        } catch (e) {
            console.log('Haptic feedback not supported');
        }
    }
}

function setupResponsiveLayout() {
    const appContainer = document.getElementById('appContainer');
    
    function handleResize() {
        if (window.innerWidth <= 768) {
            appContainer.classList.add('mobile-layout');
        } else {
            appContainer.classList.remove('mobile-layout');
        }
    }
    
    window.addEventListener('resize', handleResize);
    handleResize();
}

// Function to share event (for Telegram)
function shareEvent(event) {
    if (telegramWebApp && telegramWebApp.share) {
        telegramWebApp.share({
            url: window.location.href,
            text: `Смотри, интересное событие "${event.title}" в зале ${event.hall}!`
        });
    } else {
        // Fallback to clipboard API
        navigator.clipboard.writeText(`${event.title} - ${event.hall} (${new Date(event.start).toLocaleString()})`);
        alert('Ссылка скопирована в буфер обмена!');
    }
}

// Expose functions globally for use in other scripts
window.selectEvent = selectEvent;
window.flyToHall = flyToHall;
window.showEventDetails = showEventDetails;