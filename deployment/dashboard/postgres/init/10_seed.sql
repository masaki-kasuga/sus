-- 開発用：毎回seedを入れ直して、UIで見える値にする
TRUNCATE TABLE wm.sensor_readings;

-- distance: 50%になるようにmm=18.25前後にする
-- measured_at: now() を使って最新にする
INSERT INTO wm.sensor_readings
  (measured_at, raspberrypi_id, sensor_id, sensor_type, reading_value, voltage, unit)
VALUES
  (now() - interval '4 seconds', 'dwc-pi-five', 'XiaoESP32C3-VL53L1X_3', 'distance', 18.0, 0.650, 'mm'),
  (now() - interval '3 seconds', 'dwc-pi-five', 'XiaoESP32C3-VL53L1X_3', 'distance', 18.2, 0.648, 'mm'),
  (now() - interval '2 seconds', 'dwc-pi-five', 'XiaoESP32C3-VL53L1X_3', 'distance', 18.3, 0.651, 'mm'),
  (now() - interval '1 seconds', 'dwc-pi-five', 'XiaoESP32C3-VL53L1X_3', 'distance', 18.25, 0.649, 'mm'),
  (now(),                  'dwc-pi-five', 'XiaoESP32C3-VL53L1X_3', 'distance', 18.25, 0.652, 'mm');

-- ON CONFLICT (sensor_id, measured_at) DO NOTHING;
