# Distance measurement sensor
## Requirments
### Sensor requirements
#### Measurement performance
- Measurement principle: ToF
- Measurement range: Minimum 200 mm / Maximum 3000 mm
- Accuracy: ± 100 mm (or ± 10 % of distance)
- Resolution: 10 mm
- Repeatability: 10 mm
- Measurement update rate: 1s interval
#### Environmental conditions
- Operating temperature range: 0°C to 50 °C
- Operating humidity: 20% to 80% RH (non-condensing)
- Ambient light immunity: Must operate correctly under indoor lighting
- Target surface dependency: At the very least, valid values ​​can be obtained for polyethylene garbage bags and cardboard boxes.
#### Electrical characteristics (sensor side only)
- Operating voltage: 3.3 V
- Typical current consumption:
 15 mA
- Peak current consumption:
 40 mA
- Power-up stabilization time:
 100 ms
#### Interface characteristics
- Interface type: I2C / SPI / UART / GPIO
- Logic voltage level:3.3 V
- Address / ID configurability: Fixed / Configurable
- Error reporting: Timeout / Invalid measurement / Out-of-range indication
#### Reliability and lifetime
- Expected operational lifetime: 1 years
- Continuous operation capability: Supported
- Failure behavior: Output shall fail-safe (e.g. invalid flag instead of frozen value)
### Circuit requirements
#### System composition
- Include a distance measurement sensor device.
- Include a BLE microcontroller capable of broadcasting measured distance data via BLE advertisement.
-   BLE version: BLE 4.2 or later (BLE 5.x preferred)
-   Advertising interval: configurable (e.g., 100 ms–10 s)
-   Payload: include device ID + distance + battery voltage (optional)
#### Power input and protection
- Power source: DC 5 V (USB Type-A / Type-C, specify connector).
- Overcurrent protection shall be implemented on the VBUS line.
-   Example: resettable fuse (polyfuse / PTC) or eFuse / load switch
-   Hold current / trip current shall be selected so normal operation never trips.
- Reverse polarity protection shall be considered if the power connector can be miswired (if applicable).
- Surge / ESD protection should be implemented at the power input and external interfaces (TVS recommended).
#### Power regulation and stability
- The circuit shall provide regulated supply rails required by the sensor and MCU (e.g., 3.3 V).
- The circuit shall tolerate peak current during BLE TX without brownout/reset.
-   Brownout / reset shall not occur during normal advertising operation.
- Provide sufficient bulk and decoupling capacitors near MCU and sensor (layout requirement).
#### Wiring / mechanical robustness (no-loose requirement)
- Wiring between sensor, microcontroller, and power supply shall not become loose during operation, transportation, or vibration.
- Use locking connectors or strain relief to prevent disconnection.
-   Examples: JST-PH/GH, Molex PicoLock, board-to-board connector, screw terminal (if appropriate)
- Avoid breadboard / Dupont jumper cables for production units unless mechanically fixed.
- Cable routing shall include strain relief (cable tie / adhesive mount / clamp) where necessary.
#### Indicator and diagnostics
- Provide visible indicators to detect abnormalities easily:
-   Power indicator (5 V or 3.3 V)
-   Status indicator (BLE advertising / measurement activity)
-   Error indicator (sensor failure / out-of-range / overcurrent trip)
- LED behavior shall be clearly defined:
-   Normal: periodic blink (e.g., 100 ms every 5 s)
-   Error: fast blink pattern or solid on
-   Overcurrent trip (if detectable): dedicated pattern
- Provide a debug interface for development and troubleshooting (optional for production):
-   UART test pads, SWD/JTAG pads, or USB serial
#### Sensor interface and signal integrity
- Sensor interface shall match the selected sensor (I2C/SPI/UART).
-   Define logic level (e.g., 3.3 V)
-   Provide pull-up resistors for I2C if needed (value range specified)
- If the sensor cable length is non-trivial, noise immunity measures shall be applied (series resistors, shielding, lower speed, etc.).
#### Firmware/operation-related circuit requirements (boundary)
- Provide a method to set or identify device ID (label, resistor strap, DIP switch, or programmed ID).
- Ensure firmware update / programming method is available (USB bootloader, SWD, pogo-pin pads, etc.).
- Provide watchdog/reset strategy (hardware reset line accessible; optional watchdog).
#### Safety and compliance considerations (as applicable)
- No exposed conductive parts shall short to enclosure or user-accessible metal.
- Thermal behavior: protection components shall not exceed safe surface temperature under fault conditions.
- Materials and assembly shall support the intended environment (indoor/outdoor, dust, etc.).
## やりたいこと
- どのセンサデバイスでも共通のコードで運用したい（deviceNameを含む）
-   GPIOのLOW, HIGHを読んで、適切な振る舞いをOTA後などで判断する
-   Arrayのディップスイッチで判別する
