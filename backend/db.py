"""
Databricks SQL Warehouse Connection Module
Handles database operations for disaster assistance application
"""

import os
from typing import List, Dict, Any, Optional
from databricks import sql
from contextlib import contextmanager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
CATALOG = "pb_demo"
SCHEMA = "disaster_assistance"
SQL_WAREHOUSE_ID = "8462d1990e5969fe"

def get_databricks_connection():
    """
    Create a connection to Databricks SQL Warehouse
    Uses environment variables or Databricks Apps authentication
    """
    # In Databricks Apps, authentication is handled automatically
    # through the app's service principal
    server_hostname = os.getenv("DATABRICKS_SERVER_HOSTNAME")
    http_path = f"/sql/1.0/warehouses/{SQL_WAREHOUSE_ID}"

    # When running in Databricks Apps, use OAuth for machine-to-machine
    if not server_hostname:
        # Try to extract from workspace URL
        workspace_url = os.getenv("DATABRICKS_HOST")
        if workspace_url:
            server_hostname = workspace_url.replace("https://", "")

    # For local development, use token authentication
    access_token = os.getenv("DATABRICKS_TOKEN")

    if access_token and server_hostname:
        return sql.connect(
            server_hostname=server_hostname,
            http_path=http_path,
            access_token=access_token
        )
    else:
        # In production Databricks Apps environment
        # The connection will use the app's service principal automatically
        logger.info("Using Databricks Apps authentication")
        return None  # Will be handled by the app runtime

@contextmanager
def get_cursor():
    """Context manager for database cursor"""
    conn = get_databricks_connection()
    if conn:
        try:
            cursor = conn.cursor()
            yield cursor
        finally:
            cursor.close()
            conn.close()
    else:
        # For now, yield None - we'll implement app-based auth later
        yield None

def initialize_schema():
    """Initialize database schema if it doesn't exist"""
    try:
        with get_cursor() as cursor:
            if cursor is None:
                logger.warning("Database connection not available - skipping schema initialization")
                return False

            # Read and execute schema SQL
            schema_file = os.path.join(os.path.dirname(__file__), "schema.sql")
            with open(schema_file, 'r') as f:
                schema_sql = f.read()

            # Execute each statement separately
            statements = [s.strip() for s in schema_sql.split(';') if s.strip()]
            for statement in statements:
                if statement:
                    cursor.execute(statement)

            logger.info("Database schema initialized successfully")
            return True
    except Exception as e:
        logger.error(f"Error initializing schema: {e}")
        return False

def save_earthquake_event(earthquake: Dict[str, Any]) -> bool:
    """Save earthquake event to database"""
    try:
        with get_cursor() as cursor:
            if cursor is None:
                return False

            cursor.execute(f"""
                MERGE INTO {CATALOG}.{SCHEMA}.earthquake_events AS target
                USING (SELECT
                    %(id)s as id,
                    %(magnitude)s as magnitude,
                    %(place)s as place,
                    %(time)s as time,
                    %(updated)s as updated,
                    %(longitude)s as longitude,
                    %(latitude)s as latitude,
                    %(depth)s as depth,
                    %(url)s as url,
                    %(detail)s as detail,
                    %(felt)s as felt,
                    %(tsunami)s as tsunami,
                    %(type)s as type,
                    from_unixtime(%(time)s / 1000) as event_date
                ) AS source
                ON target.id = source.id
                WHEN NOT MATCHED THEN INSERT *
            """, earthquake)
            return True
    except Exception as e:
        logger.error(f"Error saving earthquake: {e}")
        return False

def save_homeowner_application(application: Dict[str, Any]) -> bool:
    """Save homeowner application to database"""
    try:
        with get_cursor() as cursor:
            if cursor is None:
                return False

            # Insert main application
            cursor.execute(f"""
                INSERT INTO {CATALOG}.{SCHEMA}.homeowner_applications
                (id, earthquake_id, name, address, latitude, longitude, phone,
                 damage_type, assistance_requested, status, application_date,
                 family_size, estimated_damage, estimated_property_value,
                 damage_percentage, has_fraud_flag, risk_score,
                 inspector_assigned, inspector_name)
                VALUES (
                    %(id)s, %(earthquake_id)s, %(name)s, %(address)s,
                    %(latitude)s, %(longitude)s, %(phone)s, %(damage_type)s,
                    %(assistance_requested)s, %(status)s, %(application_date)s,
                    %(family_size)s, %(estimated_damage)s, %(estimated_property_value)s,
                    %(damage_percentage)s, %(has_fraud_flag)s, %(risk_score)s,
                    %(inspector_assigned)s, %(inspector_name)s
                )
            """, application)

            # Insert fraud indicators
            for indicator in application.get('fraud_indicators', []):
                cursor.execute(f"""
                    INSERT INTO {CATALOG}.{SCHEMA}.fraud_indicators
                    (application_id, indicator)
                    VALUES (%(id)s, %(indicator)s)
                """, {'id': application['id'], 'indicator': indicator})

            # Insert missing documents
            for doc in application.get('missing_documents', []):
                cursor.execute(f"""
                    INSERT INTO {CATALOG}.{SCHEMA}.missing_documents
                    (application_id, document_name)
                    VALUES (%(id)s, %(doc)s)
                """, {'id': application['id'], 'doc': doc})

            # Insert next steps
            for idx, step in enumerate(application.get('next_steps', [])):
                cursor.execute(f"""
                    INSERT INTO {CATALOG}.{SCHEMA}.next_steps
                    (application_id, step_description, step_order)
                    VALUES (%(id)s, %(step)s, %(order)s)
                """, {'id': application['id'], 'step': step, 'order': idx + 1})

            return True
    except Exception as e:
        logger.error(f"Error saving homeowner application: {e}")
        return False

def get_homeowner_applications(earthquake_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve homeowner applications from database"""
    try:
        with get_cursor() as cursor:
            if cursor is None:
                return []

            query = f"""
                SELECT
                    ha.*,
                    COLLECT_LIST(DISTINCT fi.indicator) as fraud_indicators,
                    COLLECT_LIST(DISTINCT md.document_name) as missing_documents,
                    COLLECT_LIST(STRUCT(ns.step_order, ns.step_description)) as next_steps
                FROM {CATALOG}.{SCHEMA}.homeowner_applications ha
                LEFT JOIN {CATALOG}.{SCHEMA}.fraud_indicators fi ON ha.id = fi.application_id
                LEFT JOIN {CATALOG}.{SCHEMA}.missing_documents md ON ha.id = md.application_id
                LEFT JOIN {CATALOG}.{SCHEMA}.next_steps ns ON ha.id = ns.application_id
                WHERE 1=1
            """

            params = {}
            if earthquake_id:
                query += " AND ha.earthquake_id = %(earthquake_id)s"
                params['earthquake_id'] = earthquake_id

            query += " GROUP BY ha.id"

            cursor.execute(query, params)
            results = cursor.fetchall()

            # Convert to list of dictionaries
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in results]
    except Exception as e:
        logger.error(f"Error retrieving homeowner applications: {e}")
        return []
