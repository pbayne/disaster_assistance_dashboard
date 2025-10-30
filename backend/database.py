"""
PostgreSQL Database Connection and Schema for Disaster Assistance Dashboard
Uses Neon PostgreSQL with SQLAlchemy and asyncpg
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, BigInteger, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Load environment variables
load_dotenv()

# Database URL from environment
# Support both full DATABASE_URL and individual components (for Databricks secrets)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Construct DATABASE_URL from individual components
    postgres_host = os.getenv("POSTGRES_HOST")
    postgres_db = os.getenv("POSTGRES_DB")
    postgres_user = os.getenv("POSTGRES_USER")
    postgres_password = os.getenv("POSTGRES_PASSWORD")

    if all([postgres_host, postgres_db, postgres_user, postgres_password]):
        DATABASE_URL = f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}/{postgres_db}?sslmode=require"
    else:
        raise ValueError("DATABASE_URL or all individual POSTGRES_* environment variables must be set")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Log SQL queries for debugging
    pool_pre_ping=True,  # Verify connections before using them
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# Homeowner model
class Homeowner(Base):
    __tablename__ = "homeowners"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    damage_level = Column(String, nullable=False)  # 'severe', 'moderate', 'minor'
    estimated_cost = Column(Float, nullable=False)
    contact = Column(String)
    status = Column(String, default='Pending')  # Approval workflow status
    review_notes = Column(Text)
    reviewer_name = Column(String)
    review_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Earthquake model
class Earthquake(Base):
    __tablename__ = "earthquakes"

    id = Column(String, primary_key=True, index=True)
    magnitude = Column(Float, nullable=False)
    place = Column(String, nullable=False)
    time = Column(BigInteger, nullable=False)  # Unix timestamp in milliseconds
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    depth = Column(Float, nullable=False)
    data_source = Column(String, default='USGS')  # 'USGS' or 'synthetic'
    cached_at = Column(DateTime, default=datetime.utcnow)


# Inspector model
class Inspector(Base):
    __tablename__ = "inspectors"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    cases_assigned = Column(Integer, default=0)
    current_location = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Sync Metadata model - tracks last synchronization timestamps
class SyncMetadata(Base):
    __tablename__ = "sync_metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sync_type = Column(String, nullable=False, unique=True)  # 'earthquake', 'homeowner', etc.
    last_sync_time = Column(BigInteger, nullable=False)  # Unix timestamp in milliseconds
    last_sync_date = Column(DateTime, nullable=False)
    records_synced = Column(Integer, default=0)
    status = Column(String, default='success')  # 'success', 'failed', 'in_progress'
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Database dependency for FastAPI
def get_db():
    """
    Dependency function for FastAPI to get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Initialize database tables
def init_db():
    """
    Create all database tables
    """
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


# Test connection
def test_connection():
    """
    Test database connection
    """
    try:
        with engine.connect() as connection:
            print(f"Successfully connected to database at {engine.url}")
            return True
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return False


# Get database health and statistics
def get_database_health():
    """
    Get comprehensive database health information including:
    - Connection status
    - Database name and host
    - Table counts
    - Uptime information
    """
    from sqlalchemy import text
    import time

    start_time = time.time()

    try:
        with engine.connect() as connection:
            # Get database version and uptime
            result = connection.execute(text("SELECT version()"))
            version = result.scalar()

            # Get current database name
            result = connection.execute(text("SELECT current_database()"))
            database_name = result.scalar()

            # Count records in each table
            tables_info = {}

            # Count earthquakes
            result = connection.execute(text("SELECT COUNT(*) FROM earthquakes"))
            tables_info['earthquakes'] = result.scalar()

            # Count homeowners
            result = connection.execute(text("SELECT COUNT(*) FROM homeowners"))
            tables_info['homeowners'] = result.scalar()

            # Count inspectors
            result = connection.execute(text("SELECT COUNT(*) FROM inspectors"))
            tables_info['inspectors'] = result.scalar()

            # Count sync_metadata
            result = connection.execute(text("SELECT COUNT(*) FROM sync_metadata"))
            tables_info['sync_metadata'] = result.scalar()

            # Get database size
            result = connection.execute(text("SELECT pg_database_size(current_database())"))
            db_size_bytes = result.scalar()
            db_size_mb = round(db_size_bytes / (1024 * 1024), 2)

            response_time = round((time.time() - start_time) * 1000, 2)  # in milliseconds

            return {
                "status": "connected",
                "healthy": True,
                "database_name": database_name,
                "host": engine.url.host,
                "port": engine.url.port or 5432,
                "database_size_mb": db_size_mb,
                "version": version,
                "tables": tables_info,
                "response_time_ms": response_time,
                "connection_pool": {
                    "size": engine.pool.size(),
                    "checked_in": engine.pool.checkedin(),
                    "checked_out": engine.pool.checkedout(),
                    "overflow": engine.pool.overflow()
                }
            }
    except Exception as e:
        return {
            "status": "disconnected",
            "healthy": False,
            "error": str(e),
            "response_time_ms": round((time.time() - start_time) * 1000, 2)
        }


if __name__ == "__main__":
    # Test connection
    if test_connection():
        # Initialize tables
        init_db()
