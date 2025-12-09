# Comic Con Festival Schedule

This is a web application for viewing the schedule of events at a Comic Con festival. The application features a modern UI with filtering, search, and map visualization capabilities.

## Features

- **Multi-day schedule**: View events across 3 days of the festival
- **Filtering**: Filter by halls (Зал 3, Зал 4, Зал 5), tags, and search by title
- **Favorites**: Mark events as favorites for quick access
- **Real-time countdown**: See time remaining until events start
- **Map visualization**: View event locations on a festival map with interactive points
- **Dark/Light theme**: Toggle between dark and light themes
- **Responsive design**: Works well on different screen sizes

## Structure

The application consists of the following files:

- `index.html`: Main HTML structure
- `app.js`: JavaScript logic for filtering, search, and UI interactions
- `style.css`: CSS styling with theme variables
- `event1.json`, `event2.json`, `event3.json`: Event data for each day
- `map/map_raw.jpg`: Festival map image
- `bot/bot.js`: Telegram bot integration code

## Event Data Format

Each event in the JSON files contains:

- `id`: Unique identifier for the event
- `title`: Event title
- `hall`: Hall number (3, 4, or 5)
- `roomName`: Room name within the hall
- `startTime`/`endTime`: ISO date strings for event timing
- `tags`: Array of tags for filtering
- `mapPoints`: Array of map coordinates (x, y as percentages of image dimensions)

## Telegram Bot

The application includes a Telegram bot in `bot/bot.js` that provides a web app button to open the schedule. To use the bot:

1. Set your bot token as an environment variable: `BOT_TOKEN=your_token_here`
2. Update the `WEBAPP_URL` constant to point to your deployed application
3. Run the bot with Node.js

## Local Development

To run the application locally:

1. Start a local server (since it makes requests to JSON files):
   ```bash
   npx http-server /workspace
   ```
   or
   ```bash
   python3 -m http.server 8000
   ```

2. Open the provided URL in your browser

## Deployment

The application is designed to work with GitHub Pages. The `.nojekyll` file is included to ensure proper static file serving.

## Customization

To customize for your own event:

1. Update the JSON files with your event data
2. Modify the map image in `map/` directory
3. Adjust CSS variables in `style.css` for your color scheme
4. Update the hall filter in `index.html` if needed
5. Modify the `filesByDay` mapping in `app.js` if you have different day files

## Technologies Used

- HTML5
- CSS3 (with flexbox and variables)
- JavaScript (ES6+)
- JSON for data storage
- Responsive design techniques
- Theme switching with CSS variables
- Interactive map positioning using object-fit calculations