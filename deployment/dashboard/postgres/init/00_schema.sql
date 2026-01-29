-- dashboard/deployment/postgres/init/00_schema.sql
CREATE SCHEMA IF NOT EXISTS wm;

CREATE TABLE IF NOT EXISTS wm.sensor_readings (
  measured_at     timestamptz NOT NULL,
  ingested_at     timestamptz NOT NULL DEFAULT now(),

  raspberrypi_id  text        NOT NULL,
  sensor_id       text        NOT NULL,
  sensor_type     text        NOT NULL,

  reading_value   double precision NOT NULL,
  voltage         double precision,
  unit            text NOT NULL,

  CONSTRAINT sensor_readings_pk PRIMARY KEY (sensor_id, measured_at)
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_time_desc
  ON wm.sensor_readings (sensor_id, measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_type_time_desc
  ON wm.sensor_readings (sensor_type, measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_pi_time_desc
  ON wm.sensor_readings (raspberrypi_id, measured_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wm_ingestor') THEN
    CREATE ROLE wm_ingestor LOGIN PASSWORD 'dwc-iot-pi';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wm_app') THEN
    CREATE ROLE wm_app LOGIN PASSWORD 'dwc-iot-pi';
  END IF;
END $$;

GRANT USAGE ON SCHEMA wm TO wm_ingestor;
GRANT INSERT, SELECT ON wm.sensor_readings TO wm_ingestor;

GRANT USAGE ON SCHEMA wm TO wm_app;
GRANT SELECT ON wm.sensor_readings TO wm_app;
