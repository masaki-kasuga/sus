# Raspberry Pi Device Implementation

IoT programs for Raspberry Pi

## Overview

Collects data from various sensors, processes it, and sends it to the server.

## Supported Sensors

- Temperature/Humidity Sensors (DHT22, BME280, etc.)
- CO2 Sensor
- Power Sensor
- Camera Module
- Other GPIO-connected devices

## Setup

### Requirements

- Raspberry Pi (3/4/5/Zero)
- Raspbian OS
- Python 3.7+

### Installation

```bash
cd devices/raspi
pip install -r requirements.txt
```

### Run

```bash
python main.py
```

## Configuration

You can configure API connection destinations, sensor settings, etc. in `config.json`.

## Program Structure

- `sensors/` - Drivers for each sensor
- `data_processor/` - Data processing
- `network/` - API communication
- `main.py` - Main program
