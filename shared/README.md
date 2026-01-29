# Shared Libraries

Libraries and utilities shared across projects

## Overview

Consolidates common code used by multiple packages.

## Structure

### types/

Common type definitions (TypeScript/Python)

- Sensor data types
- API request/response types
- Device configuration types

### utils/

Utility functions

- Data conversion
- Validation
- Date/time processing
- Logging

### config/

Common configuration files

- Environment variable definitions
- Default settings
- Constant definitions

## Usage

Import from each package using relative paths or package names.

```typescript
// TypeScript example
import { SensorData } from '@shared/types';
import { formatTimestamp } from '@shared/utils';
```

```python
# Python example
from shared.types import SensorData
from shared.utils import format_timestamp
```
