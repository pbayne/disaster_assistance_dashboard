"""
Generate synthetic earthquake data for testing without hitting USGS API
"""
import random
import time
from datetime import datetime, timedelta

# Major earthquake-prone regions with HIGH concentration in California
EARTHQUAKE_REGIONS = [
    # Southern California - San Andreas Fault, LA Basin
    {"name": "Southern California", "lat_range": (32.5, 35.5), "lng_range": (-121.0, -114.5), "frequency": 0.35},
    # Central California - Parkfield, San Andreas
    {"name": "Central California", "lat_range": (35.0, 37.5), "lng_range": (-122.0, -119.0), "frequency": 0.25},
    # Northern California - Bay Area, Hayward Fault
    {"name": "Northern California", "lat_range": (37.0, 40.0), "lng_range": (-123.5, -121.0), "frequency": 0.20},
    # Alaska - still active but less frequent
    {"name": "Alaska", "lat_range": (51.0, 71.5), "lng_range": (-179.0, -129.0), "frequency": 0.10},
    # Nevada - Eastern California border
    {"name": "Nevada", "lat_range": (35.0, 42.0), "lng_range": (-120.0, -114.0), "frequency": 0.05},
    # Hawaii
    {"name": "Hawaii", "lat_range": (18.9, 22.2), "lng_range": (-160.3, -154.8), "frequency": 0.03},
    # Pacific Northwest
    {"name": "Pacific Northwest", "lat_range": (42.0, 49.0), "lng_range": (-125.0, -116.5), "frequency": 0.02},
]

PLACE_NAMES = {
    "Southern California": [
        "Los Angeles", "San Diego", "Riverside", "San Bernardino", "Imperial Valley",
        "Salton Sea", "Palm Springs", "Ridgecrest", "Bakersfield", "Santa Barbara",
        "Ventura", "Oceanside", "Escondido", "Indio", "Coachella Valley"
    ],
    "Central California": [
        "Parkfield", "San Luis Obispo", "Paso Robles", "Fresno", "Visalia",
        "Coalinga", "King City", "Salinas", "Monterey", "Hollister"
    ],
    "Northern California": [
        "San Francisco", "Oakland", "San Jose", "Berkeley", "Hayward",
        "Fremont", "Santa Cruz", "Gilroy", "Morgan Hill", "Walnut Creek",
        "Concord", "Vallejo", "Napa", "Santa Rosa", "Eureka"
    ],
    "Alaska": ["Anchorage", "Fairbanks", "Aleutian Islands", "Kodiak", "Kenai Peninsula"],
    "Nevada": ["Reno", "Las Vegas", "Tonopah", "Elko", "Walker Lake"],
    "Hawaii": ["Big Island", "Maui", "Kilauea", "Hilo", "Kona"],
    "Pacific Northwest": ["Seattle", "Portland", "Eugene", "Olympia", "Tacoma"],
}


def generate_synthetic_earthquakes(num_earthquakes: int = 100, days_back: int = 30) -> list:
    """
    Generate synthetic earthquake data that mimics USGS format

    Args:
        num_earthquakes: Number of earthquakes to generate
        days_back: How many days back in time to generate data

    Returns:
        List of earthquake dictionaries in USGS format
    """
    earthquakes = []
    current_time = int(time.time() * 1000)  # Current time in milliseconds

    for i in range(num_earthquakes):
        # Select region based on frequency weights
        region = random.choices(
            EARTHQUAKE_REGIONS,
            weights=[r["frequency"] for r in EARTHQUAKE_REGIONS]
        )[0]

        # Generate random location within region
        lat = random.uniform(region["lat_range"][0], region["lat_range"][1])
        lng = random.uniform(region["lng_range"][0], region["lng_range"][1])

        # Generate magnitude (most earthquakes are small)
        # Use exponential distribution: more small quakes, fewer large ones
        mag = random.triangular(1.0, 2.5, 7.5)

        # Generate depth (km) - most are shallow
        depth = random.triangular(0.5, 10.0, 600.0)

        # Generate time within the past days_back days
        time_offset_ms = random.randint(0, days_back * 24 * 60 * 60 * 1000)
        event_time = current_time - time_offset_ms

        # Generate place name
        place_options = PLACE_NAMES.get(region["name"], [region["name"]])
        distance_km = random.randint(1, 150)
        direction = random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"])
        place = f"{distance_km}km {direction} of {random.choice(place_options)}, {region['name']}"

        # Create earthquake record in USGS format
        earthquake = {
            "id": f"synthetic{i:05d}",
            "magnitude": round(mag, 2),
            "place": place,
            "time": event_time,
            "longitude": round(lng, 4),
            "latitude": round(lat, 4),
            "depth": round(depth, 2),
            "url": f"https://earthquake.usgs.gov/earthquakes/eventpage/synthetic{i:05d}",
            "tsunami": 1 if mag >= 7.0 and depth < 50 else 0,
            "type": "earthquake"
        }

        earthquakes.append(earthquake)

    # Sort by time (most recent first)
    earthquakes.sort(key=lambda x: x["time"], reverse=True)

    return earthquakes


def generate_earthquakes_by_timeframe(timeframe: str = "month") -> list:
    """
    Generate earthquakes for a specific timeframe

    Args:
        timeframe: 'hour', 'day', 'week', or 'month'

    Returns:
        List of synthetic earthquakes
    """
    timeframe_config = {
        "hour": {"days": 1/24, "count": 20},
        "day": {"days": 1, "count": 50},
        "week": {"days": 7, "count": 200},
        "month": {"days": 30, "count": 500}
    }

    config = timeframe_config.get(timeframe, timeframe_config["month"])
    return generate_synthetic_earthquakes(
        num_earthquakes=config["count"],
        days_back=int(config["days"])
    )


if __name__ == "__main__":
    # Test the generator
    print("Generating 10 sample earthquakes...")
    earthquakes = generate_synthetic_earthquakes(10, days_back=7)

    for eq in earthquakes[:5]:
        print(f"\nMagnitude {eq['magnitude']} - {eq['place']}")
        print(f"  Location: ({eq['latitude']}, {eq['longitude']})")
        print(f"  Depth: {eq['depth']} km")
        print(f"  Time: {datetime.fromtimestamp(eq['time']/1000).strftime('%Y-%m-%d %H:%M:%S')}")
