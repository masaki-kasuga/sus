# M5Stack/M5StickC Device Implementation

IoT programs for M5Stack products

## Overview

Collects sensor data and displays it using M5Stack/M5StickC.

## Supported Devices

- M5Stack Basic/Core/Core2
- M5StickC/M5StickC Plus
- M5Atom
- Various M5 Units (ENV/CO2/ANGLE, etc.)

## Setup

### Development Environment

- Arduino IDE or PlatformIO
- M5Stack Library

### For Arduino IDE

1. Install Arduino IDE
2. Install M5Stack library
3. Open `m5stack.ino`
4. Select board and upload

### For PlatformIO

```bash
cd devices/m5
pio run --target upload
```

## Program Structure

- `src/` - Source code
- `lib/` - Libraries
- `include/` - Header files
- `platformio.ini` - PlatformIO configuration

## Features

- Sensor data reading
- LCD/OLED display
- WiFi connection and data transmission
- Button operations
- Battery management
