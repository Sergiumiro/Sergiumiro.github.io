# Comic Con Schedule Application - Technical Documentation

## Overview

This is a comprehensive event schedule application built for a Comic Con festival. The application provides users with a modern interface to browse, filter, and locate events across multiple days and venues.

## Architecture

### Frontend Structure
- **HTML**: Semantic structure with templates for event cards
- **CSS**: Modern styling with CSS variables for theming
- **JavaScript**: Modular functionality with clear separation of concerns

### Data Structure
The application uses JSON files to store event data for each day:
- `event1.json`: Day 1 events
- `event2.json`: Day 2 events
- `event3.json`: Day 3 events

Each event contains:
- `id`: Unique identifier
- `title`: Event name
- `hall`: Venue hall number
- `roomName`: Specific room within the hall
- `startTime`/`endTime`: ISO 8601 formatted timestamps
- `tags`: Array of category tags
- `mapPoints`: Location coordinates on the venue map

## Key Features & Implementation

### 1. Dynamic Event Loading
```javascript
async function loadDay(day) {
    const data = await fetch(filesByDay[day]).then(r => r.json());
    events = data.slice().sort((a,b)=> new Date(a.startTime)-new Date(b.startTime));
    // Additional processing...
}
```

### 2. Comprehensive Filtering System
The application implements multiple filtering mechanisms:
- **Hall filter**: Filter events by venue hall
- **Search**: Text-based search across event titles
- **Tag filter**: Multi-tag filtering capability
- **Hide past events**: Toggle to show only upcoming events

### 3. Smart Map Visualization
The map feature uses a sophisticated coordinate transformation system:
- Converts normalized coordinates (0-1 range) to actual pixel positions
- Accounts for `object-fit: contain` behavior
- Handles responsive design and window resizing

```javascript
function updatePointPositions() {
    // Complex coordinate transformation logic
    // Handles image scaling and positioning
    // Updates map points based on event locations
}
```

### 4. Real-time Updates
- **Countdown timers**: Updates every second showing time to event start/end
- **Current/next event highlighting**: Automatically highlights ongoing and upcoming events
- **Auto-scrolling**: Scrolls to current or next relevant event

### 5. User Preferences
- **Favorites**: LocalStorage-based favorite events
- **Theme switching**: Dark/light mode with CSS variables
- **Responsive sidebar**: Collapsible navigation panel

## JavaScript Modules Breakdown

### Global Variables
```javascript
let currentDay = 1;           // Currently selected day
let events = [];              // All events for current day
let filteredEvents = [];      // Events after applying filters
let selectedId = null;        // Currently selected event
// Filter states...
```

### Event Filtering Logic
```javascript
function applyFilters() {
    const now = new Date();
    filteredEvents = events.filter(ev => {
        const start = new Date(ev.startTime);
        
        // Apply all active filters
        if (hidePast && start < now) return false;
        if (hallFilter !== "all" && String(ev.hall) !== hallFilter) return false;
        if (searchQuery && !ev.title.toLowerCase().includes(searchQuery)) return false;
        if (selectedTags.size > 0 && !ev.tags.some(t => selectedTags.has(t))) return false;
        
        return true;
    });
    
    // Update UI with filtered results
    renderList();
    renderPoints();
    // Additional updates...
}
```

### Map Point Positioning
The map positioning algorithm handles the complexity of `object-fit: contain`:
1. Gets natural image dimensions
2. Calculates scale ratio based on container size
3. Computes offset for centered positioning
4. Transforms normalized coordinates to pixel positions

## UI Components

### Sidebar Navigation
- Theme toggle (dark/light)
- Day selection
- Hall filtering
- Search functionality
- Tag filtering
- Hide past events toggle

### Event Cards
- Time display
- Title
- Tags
- Countdown timer
- Favorite button
- Visual indicators for current/next events

### Map View
- Interactive venue map
- Positioned event markers
- Selection highlighting
- Responsive scaling

## Responsive Design

The application is fully responsive:
- Mobile-friendly sidebar that slides in/out
- Flexible grid layouts
- Touch-friendly controls
- Responsive map that maintains aspect ratio

## State Management

### Local Storage
- Favorites are persisted across sessions
- Theme preference is saved
- No complex state management needed due to single-page nature

### URL State
- No URL parameters currently used
- All state is client-side only

## Performance Considerations

### Optimization Techniques
- Efficient filtering algorithms
- Debounced search input
- Minimal DOM updates
- Smart re-rendering only when necessary
- Lazy loading of map coordinates

### Memory Management
- Event listeners properly attached/detached
- No memory leaks in interval timers
- Efficient data structures for filtering

## Telegram Bot Integration

The application includes a Telegram bot (`bot/bot.js`) that provides a web app interface:
- Simple start command with inline keyboard
- Web app button linking to the schedule
- Basic message handling

## Deployment Considerations

### GitHub Pages Ready
- Includes `.nojekyll` file to prevent Jekyll processing
- Static file structure
- No server-side dependencies

### File Structure Requirements
- JSON files must be accessible via fetch
- Map image in correct location
- All assets in correct paths

## Customization Guide

### Adding New Days
1. Create a new JSON file (e.g., `event4.json`)
2. Update `filesByDay` mapping in `app.js`
3. Add day button in `index.html`

### Changing Venues
1. Update hall numbers in JSON files
2. Modify hall filter buttons in `index.html`
3. Adjust map coordinates in JSON files

### Styling
1. Modify CSS variables in `:root` selector
2. Update map image in `map/` directory
3. Adjust coordinate values in JSON files

## Potential Enhancements

### Future Improvements
- Calendar integration
- Push notifications for upcoming events
- Offline support with service workers
- More sophisticated search
- User accounts and personalized schedules
- Real-time updates via WebSocket
- More advanced map features

### Current Limitations
- No server-side data management
- All data is client-side JSON
- No real-time updates from backend
- Limited to static event data

## Security Considerations

### Client-Side Security
- No sensitive data stored client-side
- Input validation on search (minimal risk)
- No external API calls except for initial data load
- No user authentication required

## Testing Considerations

### Manual Testing Points
- Filter functionality across all dimensions
- Map point positioning accuracy
- Responsive design on various screen sizes
- Theme switching persistence
- Favorite saving/loading
- Time-based highlighting (current/next events)
- Countdown timer accuracy