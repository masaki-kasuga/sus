# API Specifications

Documentation for backend API specifications

## 📋 Specification List

This directory contains API specifications.

### Endpoint Specifications

- `endpoints.md` - Complete endpoint list
- `authentication.md` - Authentication and authorization
- `data-models.md` - Data model definitions

### Communication Protocols

- `rest-api.md` - RESTful API specifications
- `websocket.md` - WebSocket communication specifications
- `mqtt.md` - MQTT specifications (for device communication)

## 📝 API Design Principles

- Follow RESTful design
- Versioning (e.g., `/api/v1/`)
- Appropriate HTTP status codes
- JSON format responses
- Error handling
- Rate limiting

## 🔐 Security

- JWT authentication
- HTTPS required
- CORS configuration
- API key management

## 📊 Data Format Example

```json
{
  "device_id": "raspi-001",
  "timestamp": "2026-01-23T10:30:00Z",
  "sensors": {
    "temperature": 22.5,
    "humidity": 45.2,
    "co2": 450
  }
}
```

## 🔗 Tools

- [OpenAPI/Swagger Specification](https://swagger.io/)
- [Postman Collection](https://www.postman.com/)
