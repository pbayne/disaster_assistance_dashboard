#!/usr/bin/env python3
"""
Seed the database with sample homeowner applicants
"""
import random
import uuid
from datetime import datetime
from database import SessionLocal, Homeowner, init_db

def seed_homeowners(num_homeowners=30, center_lat=37.7749, center_lng=-122.4194, radius_miles=25):
    """
    Seed database with sample homeowner data around a specific location

    Parameters:
    - num_homeowners: Number of homeowners to create
    - center_lat: Center latitude (default: San Francisco)
    - center_lng: Center longitude (default: San Francisco)
    - radius_miles: Radius in miles
    """
    init_db()
    db = SessionLocal()

    try:
        # Get count before seeding
        existing_count = db.query(Homeowner).count()
        print(f"Existing homeowners in database: {existing_count}")

        first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
                       "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica"]

        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
                      "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"]

        street_names = ["Oak", "Maple", "Cedar", "Pine", "Elm", "Main", "Park", "Washington",
                        "Lake", "Hill", "Forest", "River", "Sunset", "Valley", "Ridge"]

        street_types = ["St", "Ave", "Rd", "Ln", "Dr", "Ct", "Way", "Blvd"]
        damage_levels = ["severe", "moderate", "minor"]
        statuses = ["Pending", "Under Review", "Approved", "Processing", "Rejected"]

        import math

        for i in range(num_homeowners):
            # Generate random point within radius
            radius_deg_lat = radius_miles / 69.0
            radius_deg_lng = radius_miles / (69.0 * math.cos(math.radians(center_lat)))

            angle = random.uniform(0, 2 * math.pi)
            distance = random.uniform(0, 1) ** 0.5

            lat = center_lat + (distance * radius_deg_lat * math.cos(angle))
            lng = center_lng + (distance * radius_deg_lng * math.sin(angle))

            # Create homeowner
            homeowner = Homeowner(
                id=f"APP-{uuid.uuid4().hex[:8].upper()}",
                name=f"{random.choice(first_names)} {random.choice(last_names)}",
                address=f"{random.randint(100, 9999)} {random.choice(street_names)} {random.choice(street_types)}",
                latitude=round(lat, 6),
                longitude=round(lng, 6),
                damage_level=random.choice(damage_levels),
                estimated_cost=random.uniform(5000, 150000),
                contact=f"({random.randint(200,999)}) {random.randint(200,999)}-{random.randint(1000,9999)}",
                status=random.choice(statuses),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )

            db.add(homeowner)

        db.commit()
        print(f"✅ Successfully seeded {num_homeowners} homeowner applicants!")
        print(f"   Center: ({center_lat}, {center_lng})")
        print(f"   Radius: {radius_miles} miles")

    except Exception as e:
        print(f"❌ Error seeding homeowners: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import sys

    # Default: San Francisco
    center_lat = 37.7749
    center_lng = -122.4194
    radius_miles = 25
    num_homeowners = 30

    if len(sys.argv) > 1:
        try:
            num_homeowners = int(sys.argv[1])
        except ValueError:
            print(f"Invalid number: {sys.argv[1]}, using default 30")

    if len(sys.argv) > 3:
        try:
            center_lat = float(sys.argv[2])
            center_lng = float(sys.argv[3])
        except ValueError:
            print(f"Invalid coordinates, using San Francisco")

    if len(sys.argv) > 4:
        try:
            radius_miles = float(sys.argv[4])
        except ValueError:
            print(f"Invalid radius, using 25 miles")

    print(f"Seeding {num_homeowners} homeowners around ({center_lat}, {center_lng}) within {radius_miles} miles...")
    seed_homeowners(num_homeowners, center_lat, center_lng, radius_miles)
