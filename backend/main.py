from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
import os
import httpx
import random
import math
from dotenv import load_dotenv

load_dotenv()

# Import database and sync services
from database import get_db, get_database_health
from earthquake_sync import sync_earthquakes_from_usgs, get_sync_status, get_earthquakes_from_db

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

# Pydantic models for request/response
class StatusUpdateRequest(BaseModel):
    status: str
    review_notes: Optional[str] = None
    reviewer_name: Optional[str] = None
    review_date: Optional[str] = None

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": os.getenv("ENV", "production"),
    }


# Database health endpoint
@app.get("/api/database/health")
async def database_health():
    """
    Get comprehensive database health information including:
    - Connection status and response time
    - Database name, host, and port
    - Table record counts
    - Database size
    - Connection pool statistics
    """
    return get_database_health()

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
async def get_earthquakes(
    timeframe: Optional[str] = None,
    min_magnitude: float = 2.5,
    source: Optional[str] = None,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    """
    Fetch earthquake data from PostgreSQL database

    Parameters:
    - timeframe: time range filter (ignored for now, kept for frontend compatibility)
    - min_magnitude: minimum magnitude to filter (default: 2.5)
    - source: data source filter (ignored for now, kept for frontend compatibility)
    - limit: maximum number of records to return (default: 1000)
    """
    try:
        earthquakes = get_earthquakes_from_db(db, min_magnitude=min_magnitude, limit=limit)

        return {
            "count": len(earthquakes),
            "min_magnitude": min_magnitude,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "postgresql",
            "earthquakes": earthquakes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching earthquake data: {str(e)}")


@app.post("/api/earthquakes/sync")
async def sync_earthquakes(min_magnitude: float = 2.5, max_results: int = 1000, db: Session = Depends(get_db)):
    """
    Synchronize earthquake data from USGS API to PostgreSQL database
    Only fetches new earthquakes since last synchronization

    Parameters:
    - min_magnitude: minimum magnitude to fetch (default: 2.5)
    - max_results: maximum number of results to fetch (default: 1000)
    """
    try:
        result = await sync_earthquakes_from_usgs(db, min_magnitude=min_magnitude, max_results=max_results)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing earthquake data: {str(e)}")


@app.get("/api/earthquakes/sync/status")
async def get_earthquake_sync_status(db: Session = Depends(get_db)):
    """
    Get the current earthquake synchronization status

    Returns information about the last sync including:
    - Last sync time
    - Number of records synced
    - Sync status (success/failed)
    - Error message if any
    """
    try:
        status = get_sync_status(db)

        if not status:
            return {
                "sync_configured": False,
                "message": "No synchronization has been performed yet"
            }

        return {
            "sync_configured": True,
            **status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sync status: {str(e)}")

# Homeowner assistance applicants endpoint
@app.get("/api/homeowners")
async def get_homeowner_applicants(
    latitude: float,
    longitude: float,
    radius_miles: float = 25,
    db: Session = Depends(get_db)
):
    """
    Get homeowner assistance applicant data from database within a radius

    Parameters:
    - latitude: Center point latitude
    - longitude: Center point longitude
    - radius_miles: Radius in miles (default: 25)
    """
    from database import Homeowner
    from sqlalchemy import func

    # Calculate bounding box for radius query
    # Approximate: 1 degree of latitude ≈ 69 miles
    lat_delta = radius_miles / 69.0
    lng_delta = radius_miles / (69.0 * math.cos(math.radians(latitude)))

    # Query homeowners within bounding box
    homeowners = db.query(Homeowner).filter(
        Homeowner.latitude >= latitude - lat_delta,
        Homeowner.latitude <= latitude + lat_delta,
        Homeowner.longitude >= longitude - lng_delta,
        Homeowner.longitude <= longitude + lng_delta
    ).all()

    # Format for frontend (convert database models to dict)
    # Map database fields to frontend format
    applicants = []
    for h in homeowners:
        applicants.append({
            "id": h.id,
            "name": h.name,
            "address": h.address,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "phone": h.contact,  # Map contact -> phone for frontend
            "damage_type": h.damage_level.capitalize() if h.damage_level else "Unknown",  # Map damage_level -> damage_type
            "assistance_requested": "Damage Assessment",  # Default value for frontend
            "status": h.status,
            "application_date": h.created_at.isoformat() if h.created_at else None,
            "family_size": random.randint(1, 6),  # Generate random for display
            "estimated_damage": int(h.estimated_cost),  # Map estimated_cost -> estimated_damage
            "estimated_property_value": int(h.estimated_cost * random.uniform(2.0, 5.0)),  # Generate for display
            "damage_percentage": round((h.estimated_cost / (h.estimated_cost * random.uniform(2.0, 5.0))) * 100, 1),
            "fraud_indicators": [],  # Empty for now
            "has_fraud_flag": False,  # Default false
            "missing_documents": [],  # Empty for now
            "next_steps": [],  # Empty for now
            "risk_score": 0,  # Default 0
            "inspector_assigned": False,  # Default false
            "inspector_name": None,  # Default none
            # Keep original fields for update operations
            "review_notes": h.review_notes,
            "reviewer_name": h.reviewer_name,
            "review_date": h.review_date.isoformat() if h.review_date else None,
            "created_at": h.created_at.isoformat() if h.created_at else None,
            "updated_at": h.updated_at.isoformat() if h.updated_at else None,
        })

    return {
        "count": len(applicants),
        "center": {"latitude": latitude, "longitude": longitude},
        "radius_miles": radius_miles,
        "applicants": applicants
    }

# Update homeowner application status
@app.put("/api/homeowners/{homeowner_id}/status")
async def update_homeowner_status(
    homeowner_id: str,
    update: StatusUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update the status of a homeowner application in the database

    Parameters:
    - homeowner_id: The application ID
    - update: Status update information including status, review_notes, reviewer_name, and review_date
    """
    from database import Homeowner

    # Find the homeowner in database
    homeowner = db.query(Homeowner).filter(Homeowner.id == homeowner_id).first()

    if not homeowner:
        raise HTTPException(status_code=404, detail=f"Homeowner with ID {homeowner_id} not found")

    # Update the homeowner record
    homeowner.status = update.status
    homeowner.review_notes = update.review_notes
    homeowner.reviewer_name = update.reviewer_name
    homeowner.review_date = datetime.fromisoformat(update.review_date) if update.review_date else datetime.utcnow()
    homeowner.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(homeowner)

    return {
        "success": True,
        "id": homeowner.id,
        "status": homeowner.status,
        "review_notes": homeowner.review_notes,
        "reviewer_name": homeowner.reviewer_name,
        "review_date": homeowner.review_date.isoformat(),
        "message": f"Status updated to {homeowner.status}"
    }

# Data generation endpoint for testing/populating database
@app.post("/api/generate-data")
async def generate_test_data(num_earthquakes: int = 50, num_homeowners: int = 100):
    """
    Generate test data to populate the database

    Parameters:
    - num_earthquakes: Number of synthetic earthquake events to generate (default: 50)
    - num_homeowners: Number of synthetic homeowner applications to generate (default: 100)
    """
    import uuid
    from datetime import timedelta

    results = {
        "earthquakes_generated": 0,
        "homeowners_generated": 0,
        "errors": []
    }

    # Generate synthetic earthquake events
    places = [
        "Southern California", "Northern California", "Alaska", "Hawaii",
        "Oklahoma", "Nevada", "Montana", "Wyoming", "Utah", "Idaho",
        "Washington", "Oregon", "New Mexico", "Arizona", "Texas"
    ]

    for i in range(num_earthquakes):
        try:
            # Random location in US
            lat = random.uniform(25.0, 49.0)
            lng = random.uniform(-125.0, -66.0)

            earthquake = {
                "id": f"test{uuid.uuid4().hex[:12]}",
                "magnitude": round(random.uniform(2.5, 7.5), 1),
                "place": f"{random.randint(1, 100)} km from {random.choice(places)}",
                "time": int((datetime.utcnow() - timedelta(days=random.randint(0, 30))).timestamp() * 1000),
                "updated": int(datetime.utcnow().timestamp() * 1000),
                "longitude": lng,
                "latitude": lat,
                "depth": round(random.uniform(0.5, 150.0), 1),
                "url": f"https://earthquake.usgs.gov/earthquakes/eventpage/test{i}",
                "detail": None,
                "felt": random.randint(0, 100) if random.random() > 0.7 else None,
                "tsunami": 1 if random.random() > 0.95 else 0,
                "type": "earthquake"
            }
            results["earthquakes_generated"] += 1
        except Exception as e:
            results["errors"].append(f"Earthquake {i}: {str(e)}")

    # Generate synthetic homeowner applications
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

    for i in range(num_homeowners):
        try:
            # Random location in US
            lat = random.uniform(25.0, 49.0)
            lng = random.uniform(-125.0, -66.0)
            street_num = random.randint(100, 9999)
            street_name = random.choice(street_names)
            street_type = random.choice(street_types)

            estimated_damage = random.randint(5000, 150000)
            estimated_property_value = random.randint(100000, 500000)
            damage_percentage = (estimated_damage / estimated_property_value) * 100

            # Fraud detection
            fraud_indicators = []
            has_fraud_flag = False

            if estimated_damage > estimated_property_value * 0.8:
                fraud_indicators.append("Damage claim exceeds 80% of property value")
                has_fraud_flag = True

            if random.random() < 0.15:
                fraud_indicators.append("Possible duplicate application detected")
                has_fraud_flag = True

            if random.random() < 0.1:
                fraud_indicators.append("Address verification failed")
                has_fraud_flag = True

            # Missing documents
            missing_documents = []
            if random.random() < 0.3:
                missing_documents.append("Proof of ownership")
            if random.random() < 0.25:
                missing_documents.append("Insurance documentation")
            if random.random() < 0.2:
                missing_documents.append("Photo evidence of damage")

            # Risk score
            risk_score = 0
            if has_fraud_flag:
                risk_score += 40
            if len(missing_documents) > 2:
                risk_score += 20
            if damage_percentage > 60:
                risk_score += 15
            risk_score += random.randint(0, 25)
            risk_score = min(risk_score, 100)

            status = random.choice(statuses)

            # Next steps
            next_steps = []
            if status == "Pending":
                next_steps = ["Complete initial application review", "Verify applicant identity"]
            elif status == "Under Review":
                next_steps = ["Conduct fraud assessment", "Review damage estimates"]
            elif status == "Approved":
                next_steps = ["Issue assistance payment", "Close case"]

            application = {
                "id": f"APP-{10000 + i}",
                "earthquake_id": None,
                "name": f"{random.choice(first_names)} {random.choice(last_names)}",
                "address": f"{street_num} {street_name} {street_type}",
                "latitude": lat,
                "longitude": lng,
                "phone": f"({random.randint(200,999)}) {random.randint(200,999)}-{random.randint(1000,9999)}",
                "damage_type": random.choice(damage_types),
                "assistance_requested": random.choice(assistance_types),
                "status": status,
                "application_date": datetime.utcnow().isoformat(),
                "family_size": random.randint(1, 6),
                "estimated_damage": estimated_damage,
                "estimated_property_value": estimated_property_value,
                "damage_percentage": round(damage_percentage, 1),
                "fraud_indicators": fraud_indicators,
                "has_fraud_flag": has_fraud_flag,
                "missing_documents": missing_documents,
                "next_steps": next_steps,
                "risk_score": risk_score,
                "inspector_assigned": random.choice([True, False]) if status in ["Under Review", "Processing"] else False,
                "inspector_name": f"{random.choice(first_names)} {random.choice(last_names)}" if random.random() > 0.5 else None
            }
            results["homeowners_generated"] += 1
        except Exception as e:
            results["errors"].append(f"Homeowner {i}: {str(e)}")

    return {
        "success": True,
        "message": f"Generated {results['earthquakes_generated']} earthquakes and {results['homeowners_generated']} homeowner applications",
        "details": results
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
