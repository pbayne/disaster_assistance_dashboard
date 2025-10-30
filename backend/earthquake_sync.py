"""
Earthquake Synchronization Service
Handles incremental syncing of earthquake data from USGS API to PostgreSQL
"""
import httpx
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from database import Earthquake, SyncMetadata


async def sync_earthquakes_from_usgs(
    db: Session,
    min_magnitude: float = 2.5,
    max_results: int = 1000
) -> Dict:
    """
    Sync earthquakes from USGS API since last synchronization

    Parameters:
    - db: Database session
    - min_magnitude: Minimum magnitude to fetch
    - max_results: Maximum number of results to fetch

    Returns:
    - Dictionary with sync results
    """

    # Get last sync metadata
    sync_meta = db.query(SyncMetadata).filter(
        SyncMetadata.sync_type == 'earthquake'
    ).first()

    # Determine start time for sync
    if sync_meta:
        start_time = sync_meta.last_sync_time
        last_sync_date = datetime.fromtimestamp(start_time / 1000)
    else:
        # First sync - get last 1 day of data
        from datetime import timedelta
        last_sync_date = datetime.utcnow() - timedelta(days=1)
        start_time = int(last_sync_date.timestamp() * 1000)

    # Current time
    end_time = int(datetime.utcnow().timestamp() * 1000)

    # Construct USGS query URL
    # Format: starttime and endtime in ISO8601 format
    start_date_iso = datetime.fromtimestamp(start_time / 1000).strftime('%Y-%m-%dT%H:%M:%S')
    end_date_iso = datetime.fromtimestamp(end_time / 1000).strftime('%Y-%m-%dT%H:%M:%S')

    url = (
        f"https://earthquake.usgs.gov/fdsnws/event/1/query?"
        f"format=geojson&"
        f"starttime={start_date_iso}&"
        f"endtime={end_date_iso}&"
        f"minmagnitude={min_magnitude}&"
        f"limit={max_results}&"
        f"orderby=time"
    )

    try:
        # Fetch data from USGS
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30.0)
            response.raise_for_status()
            data = response.json()

        # Process and store earthquakes
        new_count = 0
        updated_count = 0

        for feature in data.get("features", []):
            props = feature.get("properties", {})
            coords = feature.get("geometry", {}).get("coordinates", [])

            if len(coords) < 3:
                continue

            earthquake_id = feature.get("id")

            # Check if earthquake already exists
            existing = db.query(Earthquake).filter(
                Earthquake.id == earthquake_id
            ).first()

            if existing:
                # Update existing record
                existing.magnitude = props.get("mag")
                existing.place = props.get("place")
                existing.time = props.get("time")
                existing.latitude = coords[1]
                existing.longitude = coords[0]
                existing.depth = coords[2]
                existing.data_source = 'USGS'
                existing.cached_at = datetime.utcnow()
                updated_count += 1
            else:
                # Create new record
                new_earthquake = Earthquake(
                    id=earthquake_id,
                    magnitude=props.get("mag"),
                    place=props.get("place"),
                    time=props.get("time"),
                    latitude=coords[1],
                    longitude=coords[0],
                    depth=coords[2],
                    data_source='USGS',
                    cached_at=datetime.utcnow()
                )
                db.add(new_earthquake)
                new_count += 1

        # Update or create sync metadata
        if sync_meta:
            sync_meta.last_sync_time = end_time
            sync_meta.last_sync_date = datetime.utcnow()
            sync_meta.records_synced = new_count + updated_count
            sync_meta.status = 'success'
            sync_meta.error_message = None
            sync_meta.updated_at = datetime.utcnow()
        else:
            sync_meta = SyncMetadata(
                sync_type='earthquake',
                last_sync_time=end_time,
                last_sync_date=datetime.utcnow(),
                records_synced=new_count + updated_count,
                status='success'
            )
            db.add(sync_meta)

        # Commit changes
        db.commit()

        return {
            "success": True,
            "new_records": new_count,
            "updated_records": updated_count,
            "total_processed": new_count + updated_count,
            "last_sync_time": end_time,
            "last_sync_date": datetime.utcnow().isoformat(),
            "time_range": {
                "start": start_date_iso,
                "end": end_date_iso
            }
        }

    except Exception as e:
        # Update sync metadata with error
        if sync_meta:
            sync_meta.status = 'failed'
            sync_meta.error_message = str(e)
            sync_meta.updated_at = datetime.utcnow()
        else:
            sync_meta = SyncMetadata(
                sync_type='earthquake',
                last_sync_time=start_time,
                last_sync_date=datetime.utcnow(),
                records_synced=0,
                status='failed',
                error_message=str(e)
            )
            db.add(sync_meta)

        db.commit()

        return {
            "success": False,
            "error": str(e),
            "new_records": 0,
            "updated_records": 0,
            "total_processed": 0
        }


def get_sync_status(db: Session) -> Optional[Dict]:
    """
    Get the current synchronization status

    Parameters:
    - db: Database session

    Returns:
    - Dictionary with sync status or None
    """
    sync_meta = db.query(SyncMetadata).filter(
        SyncMetadata.sync_type == 'earthquake'
    ).first()

    if not sync_meta:
        return None

    return {
        "sync_type": sync_meta.sync_type,
        "last_sync_time": sync_meta.last_sync_time,
        "last_sync_date": sync_meta.last_sync_date.isoformat(),
        "records_synced": sync_meta.records_synced,
        "status": sync_meta.status,
        "error_message": sync_meta.error_message,
        "created_at": sync_meta.created_at.isoformat(),
        "updated_at": sync_meta.updated_at.isoformat() if sync_meta.updated_at else None
    }


def get_earthquakes_from_db(
    db: Session,
    min_magnitude: Optional[float] = None,
    limit: int = 1000
) -> List[Dict]:
    """
    Retrieve earthquakes from database

    Parameters:
    - db: Database session
    - min_magnitude: Minimum magnitude filter
    - limit: Maximum number of records to return

    Returns:
    - List of earthquake dictionaries
    """
    query = db.query(Earthquake)

    if min_magnitude:
        query = query.filter(Earthquake.magnitude >= min_magnitude)

    query = query.order_by(Earthquake.time.desc()).limit(limit)

    earthquakes = query.all()

    return [
        {
            "id": eq.id,
            "magnitude": eq.magnitude,
            "place": eq.place,
            "time": eq.time,
            "latitude": eq.latitude,
            "longitude": eq.longitude,
            "depth": eq.depth,
            "data_source": eq.data_source,
            "cached_at": eq.cached_at.isoformat() if eq.cached_at else None
        }
        for eq in earthquakes
    ]
