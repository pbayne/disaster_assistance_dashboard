import sqlite3
import httpx
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict
import asyncio

logger = logging.getLogger(__name__)

# Database file path
DB_PATH = Path(__file__).parent / "earthquakes.db"

def init_db():
    """Initialize the earthquake database schema"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create earthquakes table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS earthquakes (
            id TEXT PRIMARY KEY,
            magnitude REAL,
            place TEXT,
            time INTEGER,
            longitude REAL,
            latitude REAL,
            depth REAL,
            url TEXT,
            tsunami INTEGER,
            type TEXT,
            updated INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create metadata table to track last refresh
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create index on time for faster queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_earthquakes_time
        ON earthquakes(time DESC)
    """)

    # Create index on magnitude for filtering
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_earthquakes_magnitude
        ON earthquakes(magnitude DESC)
    """)

    conn.commit()
    conn.close()
    logger.info(f"Earthquake database initialized at {DB_PATH}")


async def fetch_and_cache_earthquakes():
    """Fetch earthquake data from USGS and cache in SQLite"""
    logger.info("Starting earthquake data refresh from USGS...")

    # Fetch 30 days of data at different magnitude levels to get comprehensive coverage
    urls = [
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",  # All earthquakes in the past month
    ]

    total_cached = 0

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for url in urls:
                try:
                    logger.info(f"Fetching from {url}")
                    response = await client.get(url)
                    response.raise_for_status()
                    data = response.json()

                    features = data.get("features", [])
                    logger.info(f"Received {len(features)} earthquakes from USGS")

                    # Insert into database
                    conn = sqlite3.connect(DB_PATH)
                    cursor = conn.cursor()

                    cached_count = 0
                    for feature in features:
                        props = feature.get("properties", {})
                        geom = feature.get("geometry", {})
                        coords = geom.get("coordinates", [0, 0, 0])

                        try:
                            cursor.execute("""
                                INSERT OR REPLACE INTO earthquakes
                                (id, magnitude, place, time, longitude, latitude, depth, url, tsunami, type, updated)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (
                                feature.get("id"),
                                props.get("mag"),
                                props.get("place"),
                                props.get("time"),
                                coords[0],  # longitude
                                coords[1],  # latitude
                                coords[2],  # depth
                                props.get("url"),
                                props.get("tsunami", 0),
                                props.get("type"),
                                props.get("updated")
                            ))
                            cached_count += 1
                        except Exception as e:
                            logger.error(f"Error caching earthquake {feature.get('id')}: {e}")

                    conn.commit()
                    total_cached += cached_count
                    logger.info(f"Cached {cached_count} earthquakes from this feed")

                    conn.close()

                except httpx.HTTPError as e:
                    logger.error(f"HTTP error fetching {url}: {e}")
                except Exception as e:
                    logger.error(f"Error processing {url}: {e}")

        # Update metadata
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO metadata (key, value, updated_at)
            VALUES ('last_refresh', ?, CURRENT_TIMESTAMP)
        """, (datetime.utcnow().isoformat(),))
        conn.commit()
        conn.close()

        logger.info(f"✅ Successfully cached {total_cached} total earthquakes")
        return total_cached

    except Exception as e:
        logger.error(f"❌ Error fetching earthquake data: {e}")
        raise


def get_cached_earthquakes(timeframe: str = "day", min_magnitude: float = 2.5) -> List[Dict]:
    """Get earthquakes from cache based on timeframe and magnitude"""

    # Calculate time threshold
    now = datetime.utcnow()
    time_thresholds = {
        "hour": now - timedelta(hours=1),
        "day": now - timedelta(days=1),
        "week": now - timedelta(days=7),
        "month": now - timedelta(days=30),
    }

    threshold = time_thresholds.get(timeframe, time_thresholds["day"])
    threshold_ms = int(threshold.timestamp() * 1000)  # USGS uses milliseconds

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM earthquakes
        WHERE time >= ? AND magnitude >= ?
        ORDER BY time DESC
    """, (threshold_ms, min_magnitude))

    rows = cursor.fetchall()
    earthquakes = [dict(row) for row in rows]

    conn.close()

    logger.info(f"Retrieved {len(earthquakes)} earthquakes from cache (timeframe={timeframe}, min_mag={min_magnitude})")
    return earthquakes


def get_last_refresh() -> str:
    """Get the timestamp of the last data refresh"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM metadata WHERE key = 'last_refresh'")
        row = cursor.fetchone()
        conn.close()

        if row:
            return row[0]
        return "Never"
    except:
        return "Never"


def should_refresh(max_age_minutes: int = 60) -> bool:
    """Check if cache should be refreshed"""
    last_refresh = get_last_refresh()

    if last_refresh == "Never":
        return True

    try:
        last_refresh_dt = datetime.fromisoformat(last_refresh)
        age = datetime.utcnow() - last_refresh_dt
        return age.total_seconds() > (max_age_minutes * 60)
    except:
        return True


# Initialize database on module import
init_db()
