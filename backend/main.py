from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Databricks Application API",
    description="FastAPI backend for Databricks application",
    version="1.0.0",
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
