from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pathlib import Path
import os
import httpx
import random
import math
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Disaster Assistance Dashboard API",
    description="FastAPI backend for Disaster Assistance Dashboard - Earthquake monitoring and homeowner assistance tracking",
    version="1.0.0",
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": os.getenv("ENV", "production"),
    }

# Sample data endpoint
@app.get("/api/data")
async def get_data():
    """Sample data endpoint"""
    return {
        "message": "Hello from FastAPI!",
        "timestamp": datetime.utcnow().isoformat(),
        "data": [
            {"id": 1, "name": "Item 1", "value": 100},
            {"id": 2, "name": "Item 2", "value": 200},
            {"id": 3, "name": "Item 3", "value": 300},
        ],
    }

# Earthquake data endpoints
@app.get("/api/earthquakes")
async def get_earthquakes(timeframe: str = "hour", min_magnitude: float = 2.5):
    """
    Fetch real-time earthquake data from USGS

    Parameters:
    - timeframe: 'hour', 'day', 'week', 'month' (default: 'hour')
    - min_magnitude: minimum magnitude to filter (default: 2.5)
    """
    # USGS API endpoints
    endpoints = {
        "hour": f"https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/{min_magnitude}_hour.geojson",
        "day": f"https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/{min_magnitude}_day.geojson",
        "week": f"https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/{min_magnitude}_week.geojson",
        "month": f"https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/{min_magnitude}_month.geojson",
    }

    url = endpoints.get(timeframe, endpoints["hour"])

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()

            # Transform the data for easier frontend consumption
            earthquakes = []
            for feature in data.get("features", []):
                props = feature.get("properties", {})
                coords = feature.get("geometry", {}).get("coordinates", [])

                if len(coords) >= 3:
                    earthquakes.append({
                        "id": feature.get("id"),
                        "magnitude": props.get("mag"),
                        "place": props.get("place"),
                        "time": props.get("time"),
                        "updated": props.get("updated"),
                        "longitude": coords[0],
                        "latitude": coords[1],
                        "depth": coords[2],
                        "url": props.get("url"),
                        "detail": props.get("detail"),
                        "felt": props.get("felt"),
                        "tsunami": props.get("tsunami", 0),
                        "type": props.get("type"),
                    })

            return {
                "count": len(earthquakes),
                "timeframe": timeframe,
                "min_magnitude": min_magnitude,
                "timestamp": datetime.utcnow().isoformat(),
                "earthquakes": earthquakes
            }

    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Error fetching earthquake data: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# Homeowner assistance applicants endpoint
@app.get("/api/homeowners")
async def generate_homeowner_applicants(latitude: float, longitude: float, radius_miles: float = 25):
    """
    Generate synthetic homeowner assistance applicant data within a radius

    Parameters:
    - latitude: Center point latitude
    - longitude: Center point longitude
    - radius_miles: Radius in miles (default: 25)
    """

    # Sample data for generation
    first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
                   "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
                   "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa"]

    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
                  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
                  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White"]

    street_names = ["Oak", "Maple", "Cedar", "Pine", "Elm", "Main", "Park", "Washington",
                    "Lake", "Hill", "Forest", "River", "Sunset", "Valley", "Ridge", "Mountain"]

    street_types = ["St", "Ave", "Rd", "Ln", "Dr", "Ct", "Way", "Blvd"]

    damage_types = ["Structural", "Foundation", "Roof", "Windows", "Chimney", "Utilities", "Multiple"]
    assistance_types = ["Emergency Repair", "Temporary Housing", "Full Reconstruction", "Inspection"]
    statuses = ["Pending", "Under Review", "Approved", "Processing", "Rejected"]

    # Generate random applicants within the radius
    num_applicants = random.randint(15, 40)
    applicants = []

    for i in range(num_applicants):
        # Generate random point within radius
        # Convert radius from miles to degrees (approximate)
        radius_deg_lat = radius_miles / 69.0
        radius_deg_lng = radius_miles / (69.0 * math.cos(math.radians(latitude)))

        # Random angle and distance
        angle = random.uniform(0, 2 * math.pi)
        distance = random.uniform(0, 1) ** 0.5  # Square root for uniform distribution

        applicant_lat = latitude + (distance * radius_deg_lat * math.cos(angle))
        applicant_lng = longitude + (distance * radius_deg_lng * math.sin(angle))

        # Generate address
        street_num = random.randint(100, 9999)
        street_name = random.choice(street_names)
        street_type = random.choice(street_types)

        applicant = {
            "id": f"APP-{1000 + i}",
            "name": f"{random.choice(first_names)} {random.choice(last_names)}",
            "address": f"{street_num} {street_name} {street_type}",
            "latitude": round(applicant_lat, 6),
            "longitude": round(applicant_lng, 6),
            "phone": f"({random.randint(200,999)}) {random.randint(200,999)}-{random.randint(1000,9999)}",
            "damage_type": random.choice(damage_types),
            "assistance_requested": random.choice(assistance_types),
            "status": random.choice(statuses),
            "application_date": datetime.utcnow().isoformat(),
            "family_size": random.randint(1, 6),
            "estimated_damage": random.randint(5000, 150000)
        }

        applicants.append(applicant)

    return {
        "count": len(applicants),
        "center": {"latitude": latitude, "longitude": longitude},
        "radius_miles": radius_miles,
        "applicants": applicants
    }

# Static files and SPA routing
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    # Mount static files
    app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")

    # Catch-all route for React Router
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for all non-API routes"""
        # If the path is a file in static directory, serve it
        file_path = static_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)

        # Otherwise, serve index.html for client-side routing
        index_path = static_dir / "index.html"
        if index_path.exists():
            return FileResponse(index_path)

        return JSONResponse(
            status_code=404,
            content={"detail": "Not found. Frontend not built yet."}
        )
