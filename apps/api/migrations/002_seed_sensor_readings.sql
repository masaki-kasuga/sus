INSERT INTO wm.sensor_readings
  (measured_at, raspberrypi_id, sensor_id, sensor_type, reading_value, voltage, unit)
VALUES
  (to_timestamp(1769570073073702335::double precision / 1e9), 'dwc-pi-five', 'XiaoESP32C3-VL53L1X_3', 'distance', 38.6, 0.650, 'mm'),
  (to_timestamp((1769570073073702335 + 1_000_000_000)::double precision / 1e9), 'dwc-pi-five', 'XiaoESP32C3-VL53L1X_3', 'distance', 38.9, 0.648, 'mm'),
  (to_timestamp((1769570073073702335 + 2_000_000_000)::double precision / 1e9), 'dwc-pi-five', 'XiaoESP32C3-VL53L1X_3', 'distance', 39.2, 0.651, 'mm'),
  (to_timestamp((1769570073073702335 + 3_000_000_000)::double precision / 1e9), 'dwc-pi-five', 'XiaoESP32C3-VL53L1X_3', 'distance', 38.1, 0.649, 'mm'),
  (to_timestamp((1769570073073702335 + 4_000_000_000)::double precision / 1e9), 'dwc-pi-five', 'XiaoESP32C3-VL53L1X_3', 'distance', 37.7, 0.652, 'mm')
ON CONFLICT (sensor_id, measured_at) DO NOTHING;
