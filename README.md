# Great Circle Calculator

A web application for calculating the shortest path between two airports using the great circle route. The app features an interactive Mapbox map, airport search from a PostgreSQL database, and calculates distance and travel time.

![Great Circle Calculator](https://img.shields.io/badge/React-18.2.0-blue) ![Vite](https://img.shields.io/badge/Vite-5.0-646CFF) ![Mapbox](https://img.shields.io/badge/Mapbox-GL_JS-green)

## Features

- **Airport Search**: Search airports by IATA/ICAO code, name, or city
- **Interactive Mapbox Map**: Click on the map or use the search to select airports
- **Distance Calculations**: View distances in kilometers, miles, and nautical miles
- **Travel Time**: Calculate travel time based on average speed
- **Initial Bearing**: Display the initial compass direction
- **Great Circle Path**: Visualize the shortest route on the map
- **Responsive Design**: Works on desktop and mobile devices
- **Database Integration**: PostgreSQL database with airport data

## Technologies Used

- **React 18**: Modern UI library
- **Vite**: Fast build tool and development server
- **Mapbox GL JS**: Interactive mapping library
- **PostgreSQL**: Airport database
- **Vercel Serverless Functions**: Backend API
- **react-map-gl**: React wrapper for Mapbox GL JS

## Prerequisites

- Node.js 16+ and npm
- Mapbox API key ([Get one free](https://account.mapbox.com/))
- PostgreSQL database with airport data

## Database Schema

Your PostgreSQL database should have an `airports` table with at least the following columns:

```sql
CREATE TABLE airports (
  id SERIAL PRIMARY KEY,
  iata_code VARCHAR(3),
  icao_code VARCHAR(4),
  name VARCHAR(255),
  city VARCHAR(255),
  country VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);
```

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd great-circle-mapper
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Mapbox API Key
VITE_MAPBOX_TOKEN=your_mapbox_access_token_here

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
```

**Getting a Mapbox Token:**
1. Sign up at [mapbox.com](https://account.mapbox.com/)
2. Go to your [Account page](https://account.mapbox.com/)
3. Copy your "Default public token" or create a new one
4. Add it to `.env.local` as `VITE_MAPBOX_TOKEN`

**Database URL Format:**
```
postgresql://username:password@hostname:5432/database_name
```

For SSL connections (common in production):
```
postgresql://username:password@hostname:5432/database_name?sslmode=require
```

### 3. Development

Start the development server:

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

### 4. Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard:
   - `VITE_MAPBOX_TOKEN`: Your Mapbox API token
   - `DATABASE_URL`: Your PostgreSQL connection string

### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `VITE_MAPBOX_TOKEN`
   - `DATABASE_URL`
6. Click "Deploy"

**Important**: Make sure to add both environment variables in the Vercel project settings before deploying.

## API Endpoints

The app includes Vercel serverless functions in the `/api` directory:

### GET /api/airports

Search airports from the database.

**Query Parameters:**
- `search` - Search by airport code, name, or city (returns up to 20 results)
- `code` - Get specific airport by IATA/ICAO code

**Examples:**
```
/api/airports?search=JFK
/api/airports?search=London
/api/airports?code=LAX
```

**Response:**
```json
[
  {
    "iata_code": "JFK",
    "icao_code": "KJFK",
    "name": "John F. Kennedy International Airport",
    "city": "New York",
    "country": "United States",
    "latitude": 40.6398,
    "longitude": -73.7789
  }
]
```

## Usage

### Searching for Airports

1. Start typing in the "Origin Airport" or "Destination Airport" search box
2. Type at least 2 characters to trigger the search
3. Select an airport from the dropdown results
4. The map will automatically update with markers

### Manual Coordinate Entry

You can also click directly on the map to set origin and destination points.

### Calculating Routes

1. Select both origin and destination airports (or click on map)
2. Optionally adjust the average speed (default: 900 km/h for commercial aircraft)
3. Click "Calculate Great Circle"
4. View results and the great circle path on the map

### Example Airports to Try

- **JFK** - John F. Kennedy International Airport, New York
- **LHR** - London Heathrow Airport, London
- **NRT** - Narita International Airport, Tokyo
- **SYD** - Sydney Airport, Sydney
- **LAX** - Los Angeles International Airport, Los Angeles

## How It Works

The application uses the **Haversine formula** to calculate the great circle distance between two points on a sphere:

```
a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```

Where:
- φ is latitude
- λ is longitude
- R is Earth's radius (6,371 km)
- d is the distance

The great circle path is generated by calculating intermediate points along the route using spherical interpolation.

## Project Structure

```
great-circle-mapper/
├── api/
│   └── airports.js          # Vercel serverless function for airport search
├── public/
├── src/
│   ├── components/
│   │   ├── Map.jsx          # Mapbox map component
│   │   └── AirportSearch.jsx # Airport search autocomplete
│   ├── utils/
│   │   └── greatCircle.js   # Calculation utilities
│   ├── App.jsx              # Main application component
│   ├── App.css              # Styles
│   └── main.jsx             # Entry point
├── .env.local               # Environment variables (create this)
├── .env.example             # Environment template
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies
```

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_MAPBOX_TOKEN` | Mapbox GL JS access token | Yes | `pk.eyJ1...` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/db` |

## Troubleshooting

### Map not loading
- Check that `VITE_MAPBOX_TOKEN` is set correctly in `.env.local`
- Verify your Mapbox token is valid at [mapbox.com/account](https://account.mapbox.com/)

### Airport search not working
- Verify `DATABASE_URL` is correct
- Check that your database is accessible
- Ensure the `airports` table exists with the correct schema
- Check browser console for API errors

### Build fails
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (should be 16+)
- Clear cache: `rm -rf node_modules .next dist && npm install`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- [Mapbox](https://www.mapbox.com/) for the mapping platform
- [react-map-gl](https://visgl.github.io/react-map-gl/) for React integration
- Great circle calculations based on the Haversine formula
- Airport data from your PostgreSQL database
