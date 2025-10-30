# Databricks React + FastAPI Application

> **🚀 Quick Deploy**: To deploy this app to Databricks, run `python deploy_to_databricks.py`

A modern full-stack application template with React, TypeScript, Material-UI, Framer Motion, and FastAPI, designed for Databricks Apps deployment.

## Features

### Frontend
- ⚛️ React 18 with TypeScript
- 🎨 Material-UI (MUI) components
- ✨ Framer Motion animations
- 🎯 Responsive drawer navigation
- 📱 Mobile-friendly design
- ⚡ Vite for fast development and builds

### Backend
- 🚀 FastAPI with automatic API documentation
- 📊 Health check and sample data endpoints
- 🗂️ Static file serving for production
- 🔄 Client-side routing support
- 🔐 CORS middleware configured

### Deployment
- 🎯 Databricks Apps ready
- 🔧 Automated build and deployment script
- 🔐 Secret management support
- ♻️ Hard redeploy option

## Project Structure

```
dbapps-project/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── AppBar.tsx   # Top navigation bar
│   │   │   ├── Drawer.tsx   # Side navigation drawer
│   │   │   └── MainContent.tsx
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                 # FastAPI application
│   ├── main.py              # FastAPI app
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
├── build.py                 # Build script
├── deploy_to_databricks.py  # Deployment script
├── app.yaml                 # Databricks configuration
└── README.md
```

## Quick Start

### Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- npm or yarn
- Databricks CLI (for deployment)

### Local Development

1. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will be available at http://localhost:5173

4. **Start Backend Development Server**
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```
   The backend will be available at http://localhost:8000
   API documentation: http://localhost:8000/docs

### Building for Production

Run the build script to compile the frontend and prepare for deployment:

```bash
python build.py
```

This will:
1. Install frontend dependencies
2. Build the React app to static files
3. Copy static files to backend/static
4. Prepare the project for deployment

## API Documentation

### Endpoints

#### Health Check
```
GET /api/health
```
Returns the health status of the API.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-23T12:00:00",
  "environment": "production"
}
```

#### Sample Data
```
GET /api/data
```
Returns sample data with a timestamp.

**Response:**
```json
{
  "message": "Hello from FastAPI!",
  "timestamp": "2025-10-23T12:00:00",
  "data": [
    {"id": 1, "name": "Item 1", "value": 100},
    {"id": 2, "name": "Item 2", "value": 200},
    {"id": 3, "name": "Item 3", "value": 300}
  ]
}
```

## Database Setup

This application uses **PostgreSQL** (via Neon serverless database) for persistent data storage of earthquakes and homeowner assistance applications.

### Database Schema

The database consists of 4 main tables:

#### 1. Earthquakes Table
Stores earthquake event data from USGS.

```sql
CREATE TABLE earthquakes (
    id VARCHAR PRIMARY KEY,           -- USGS event ID
    magnitude FLOAT NOT NULL,         -- Earthquake magnitude
    place VARCHAR NOT NULL,           -- Location description
    time BIGINT NOT NULL,            -- Event time (Unix timestamp ms)
    updated BIGINT,                  -- Last updated (Unix timestamp ms)
    longitude FLOAT NOT NULL,        -- Longitude coordinate
    latitude FLOAT NOT NULL,         -- Latitude coordinate
    depth FLOAT,                     -- Depth in kilometers
    url VARCHAR,                     -- USGS event page URL
    detail VARCHAR,                  -- USGS detail API URL
    felt INTEGER,                    -- Number of "felt" reports
    tsunami INTEGER DEFAULT 0,       -- Tsunami flag (0 or 1)
    type VARCHAR DEFAULT 'earthquake', -- Event type
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Homeowners Table
Stores homeowner assistance applications with approval workflow.

```sql
CREATE TABLE homeowners (
    id VARCHAR PRIMARY KEY,          -- Application ID (e.g., "APP-12345678")
    name VARCHAR NOT NULL,           -- Applicant name
    address VARCHAR NOT NULL,        -- Property address
    latitude FLOAT NOT NULL,         -- Property latitude
    longitude FLOAT NOT NULL,        -- Property longitude
    damage_level VARCHAR NOT NULL,   -- 'severe', 'moderate', or 'minor'
    estimated_cost FLOAT NOT NULL,   -- Estimated damage cost
    contact VARCHAR,                 -- Phone number
    status VARCHAR DEFAULT 'Pending', -- Workflow status
    review_notes TEXT,               -- Admin/applicant notes
    reviewer_name VARCHAR,           -- Who reviewed/responded
    review_date TIMESTAMP,           -- When reviewed/responded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Inspectors Table
Stores building inspector information.

```sql
CREATE TABLE inspectors (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    contact VARCHAR,
    specialty VARCHAR,
    availability VARCHAR DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. Sync Metadata Table
Tracks synchronization status for earthquake data.

```sql
CREATE TABLE sync_metadata (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR NOT NULL,      -- 'earthquake'
    last_sync_time BIGINT,           -- Last sync timestamp (Unix ms)
    last_sync_date TIMESTAMP,        -- Last sync date
    records_synced INTEGER DEFAULT 0, -- Number of records synced
    status VARCHAR DEFAULT 'pending', -- 'success', 'failed', 'pending'
    error_message TEXT,              -- Error details if failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Configuration

#### Step 1: Set Up Neon PostgreSQL Database

1. **Create a Neon account** at [neon.tech](https://neon.tech)
2. **Create a new project** and database
3. **Copy your connection string** from the Neon dashboard

#### Step 2: Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# PostgreSQL Configuration (Neon)
POSTGRES_HOST=your-project.neon.tech
POSTGRES_DB=your-database-name
POSTGRES_USER=your-username
POSTGRES_PASSWORD=your-password
```

#### Step 3: Initialize Database Schema

The schema is automatically created when the application starts. The `database.py` file uses SQLAlchemy ORM to create all tables on first run:

```bash
cd backend
python -c "from database import init_db; init_db()"
```

Or simply start the backend server (tables will be created automatically):

```bash
uvicorn main:app --reload --port 8000
```

### Data Seeding

#### Seeding Earthquake Data

Sync earthquake data from USGS API:

```bash
# Sync earthquakes (magnitude 2.5+, last 30 days)
curl -X POST "http://localhost:8000/api/earthquakes/sync?min_magnitude=2.5&max_results=1000"

# Check sync status
curl "http://localhost:8000/api/earthquakes/sync/status"
```

The sync endpoint automatically:
- Fetches only new/updated earthquakes since last sync
- Stores them in PostgreSQL
- Tracks sync metadata for incremental updates

#### Seeding Homeowner Data

**Option 1: Add New Homeowners (Preserves Existing Data)**

```bash
cd backend

# Seed 30 homeowners in San Francisco Bay Area
python3 seed_additional_homeowners.py 30 37.7749 -122.4194 150

# Seed 100 homeowners in Los Angeles
python3 seed_additional_homeowners.py 100 34.0522 -118.2437 150

# Seed 75 homeowners in San Diego
python3 seed_additional_homeowners.py 75 32.7157 -117.1611 100
```

**Parameters:**
- Argument 1: Number of homeowners to generate
- Argument 2: Center latitude
- Argument 3: Center longitude
- Argument 4: Radius in miles

**Option 2: Replace All Homeowners (Initial Seed)**

```bash
cd backend

# Replace all data with 50 homeowners in a specific area
python3 seed_homeowners.py 50 37.7749 -122.4194 25
```

⚠️ **Note:** `seed_homeowners.py` clears existing data, while `seed_additional_homeowners.py` adds to existing data.

#### Reset Application Statuses

Reset all homeowner applications to "Pending" status:

```bash
cd backend
python3 reset_statuses.py
```

This clears all review notes, reviewer names, and review dates, setting all applications back to pending state.

### Database Health Check

Check database connectivity and table statistics:

```bash
curl "http://localhost:8000/api/database/health"
```

Returns:
```json
{
  "status": "connected",
  "database": "your-database-name",
  "host": "your-project.neon.tech",
  "response_time_ms": 45.2,
  "tables": {
    "earthquakes": 1250,
    "homeowners": 525,
    "inspectors": 0,
    "sync_metadata": 1
  }
}
```

### Databricks Secret Configuration

For Databricks deployment, store database credentials as secrets:

```bash
# Create secret scope
databricks secrets create-scope disaster-assistance

# Add database secrets
databricks secrets put-secret disaster-assistance postgres_host
databricks secrets put-secret disaster-assistance postgres_db
databricks secrets put-secret disaster-assistance postgres_user
databricks secrets put-secret disaster-assistance postgres_password
```

The `app.yaml` file automatically loads these secrets as environment variables in the Databricks app.

## Deployment to Databricks

### Prerequisites

1. Install Databricks CLI:
   ```bash
   pip install databricks-cli
   ```

2. Configure Databricks CLI:
   ```bash
   databricks configure --token
   ```

### Deployment Options

#### Standard Deployment
```bash
python deploy_to_databricks.py
```

This will:
- Check Databricks CLI configuration
- Auto-detect workspace URL and user email
- Build the React frontend
- Package the backend
- Import to Databricks workspace
- Deploy the app
- Display the app URL

#### Hard Redeploy
For a complete redeployment (deletes existing app and redeploys):
```bash
python deploy_to_databricks.py --hard-redeploy
```

#### Custom App Name and Folder
```bash
python deploy_to_databricks.py --app-name my-custom-app --app-folder /Workspace/Users/user@example.com/my-app
```

### Deployment Script Features

The `deploy_to_databricks.py` script:
- ✅ Checks Databricks CLI installation and configuration
- 🔍 Auto-detects workspace URL and user email
- 🔨 Builds React frontend using npm
- 📁 Copies static files to backend
- 📦 Packages backend (excludes venv, tests, etc.)
- 📤 Imports to Databricks workspace
- 🚀 Deploys the app
- 📱 Shows app URL and status
- 🧹 Cleans up temporary files

### Environment Configuration

The app uses the following environment variables in production:

- `ENV`: Set to "production"
- `PORT`: Set to "8000"
- `DEBUG`: Set to "False"

These are automatically configured during deployment via `app.yaml`.

## Troubleshooting

### Frontend build fails
- Ensure Node.js and npm are installed
- Try deleting `node_modules` and running `npm install` again
- Check for TypeScript errors in the code

### Backend fails to start
- Ensure Python 3.9+ is installed
- Check that all dependencies are installed: `pip install -r backend/requirements.txt`
- Verify that port 8000 is not already in use

### Databricks CLI not configured
If you see an error about Databricks CLI not being configured:
1. Run `databricks configure --token`
2. Enter your workspace URL (e.g., https://your-workspace.databricks.com)
3. Enter your personal access token

To create a personal access token:
1. Go to your Databricks workspace
2. Click on your user icon → Settings
3. Go to Developer → Access tokens
4. Click "Generate new token"

### Deployment fails
- Ensure you have proper permissions in your Databricks workspace
- Check that the app name doesn't conflict with existing apps
- Try using `--hard-redeploy` flag to do a clean redeployment
- Review the error message and check workspace logs

### Static files not found
- Run `python build.py` to build the frontend
- Ensure `backend/static` directory exists and contains the built files
- Check that the build was successful

## Development Tips

### Frontend
- Components are located in `frontend/src/components/`
- MUI theme configuration is in `frontend/src/main.tsx`
- Framer Motion animations are used in the Drawer and MainContent components
- API calls use the `/api` prefix which is proxied to the backend in development

### Backend
- Add new routes in `backend/main.py`
- Static files are served from `backend/static/` in production
- CORS is configured for local development (ports 5173 and 8000)
- FastAPI automatic docs are available at `/docs` and `/redoc`

### Adding New Pages
1. Create a new component in `frontend/src/components/`
2. Add the page to the navigation items in `Drawer.tsx`
3. Update the routing logic in `MainContent.tsx` if needed

## Technology Stack

### Frontend
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Material-UI](https://mui.com/) - UI components
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Vite](https://vitejs.dev/) - Build tool

### Backend
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework
- [Uvicorn](https://www.uvicorn.org/) - ASGI server
- [Python-dotenv](https://github.com/theskumar/python-dotenv) - Environment variables

### Deployment
- [Databricks Apps](https://docs.databricks.com/en/dev-tools/databricks-apps/index.html) - Application hosting
- [Databricks CLI](https://docs.databricks.com/en/dev-tools/cli/index.html) - Deployment tool

## License

MIT

## Support

For issues and questions, please refer to:
- [Databricks Apps Documentation](https://docs.databricks.com/en/dev-tools/databricks-apps/index.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
