-- Disaster Assistance Database Schema
-- Unity Catalog: pb_demo
-- Schema: disaster_assistance

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS pb_demo.disaster_assistance;

-- Earthquake events table
CREATE TABLE IF NOT EXISTS pb_demo.disaster_assistance.earthquake_events (
    id STRING NOT NULL,
    magnitude DOUBLE NOT NULL,
    place STRING NOT NULL,
    time BIGINT NOT NULL,
    updated BIGINT,
    longitude DOUBLE NOT NULL,
    latitude DOUBLE NOT NULL,
    depth DOUBLE NOT NULL,
    url STRING,
    detail STRING,
    felt INT,
    tsunami INT,
    type STRING,
    event_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (id)
) USING DELTA
COMMENT 'USGS earthquake event data';

-- Homeowner assistance applications table
CREATE TABLE IF NOT EXISTS pb_demo.disaster_assistance.homeowner_applications (
    id STRING NOT NULL,
    earthquake_id STRING,
    name STRING NOT NULL,
    address STRING NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    phone STRING NOT NULL,
    damage_type STRING NOT NULL,
    assistance_requested STRING NOT NULL,
    status STRING NOT NULL,
    application_date TIMESTAMP NOT NULL,
    family_size INT NOT NULL,
    estimated_damage DECIMAL(12,2) NOT NULL,
    estimated_property_value DECIMAL(12,2) NOT NULL,
    damage_percentage DECIMAL(5,2) NOT NULL,
    has_fraud_flag BOOLEAN NOT NULL,
    risk_score INT NOT NULL,
    inspector_assigned BOOLEAN NOT NULL,
    inspector_name STRING,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (id)
) USING DELTA
COMMENT 'Homeowner disaster assistance applications';

-- Fraud indicators table (many-to-one relationship)
CREATE TABLE IF NOT EXISTS pb_demo.disaster_assistance.fraud_indicators (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    application_id STRING NOT NULL,
    indicator STRING NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (id),
    FOREIGN KEY (application_id) REFERENCES pb_demo.disaster_assistance.homeowner_applications(id)
) USING DELTA
COMMENT 'Fraud indicators detected for applications';

-- Missing documents table (many-to-one relationship)
CREATE TABLE IF NOT EXISTS pb_demo.disaster_assistance.missing_documents (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    application_id STRING NOT NULL,
    document_name STRING NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (id),
    FOREIGN KEY (application_id) REFERENCES pb_demo.disaster_assistance.homeowner_applications(id)
) USING DELTA
COMMENT 'Missing documents for applications';

-- Next steps table (many-to-one relationship)
CREATE TABLE IF NOT EXISTS pb_demo.disaster_assistance.next_steps (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    application_id STRING NOT NULL,
    step_description STRING NOT NULL,
    step_order INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (id),
    FOREIGN KEY (application_id) REFERENCES pb_demo.disaster_assistance.homeowner_applications(id)
) USING DELTA
COMMENT 'Next steps for processing applications';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_earthquake_date
ON pb_demo.disaster_assistance.earthquake_events(event_date);

CREATE INDEX IF NOT EXISTS idx_homeowner_status
ON pb_demo.disaster_assistance.homeowner_applications(status);

CREATE INDEX IF NOT EXISTS idx_homeowner_risk
ON pb_demo.disaster_assistance.homeowner_applications(risk_score);

CREATE INDEX IF NOT EXISTS idx_homeowner_fraud
ON pb_demo.disaster_assistance.homeowner_applications(has_fraud_flag);
