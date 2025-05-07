# Test Project

## Systems Architecture

### Frontend
- **Framework:** Angular
- **API Communication:** HTTP requests
- **Authentication:** Express sessions

### Backend
- **Authentication:** Express session
- **Database:** MySQL
- **Error Handling:** Minimal logging, no structured error responses
- **Background Tasks:** Blocking synchronous tasks in API requests

### API Gateway
- **Rate Limiting:** None - API is exposed with no request throttling
- **Load Balancing:** Single Node.js server without redundancy
- **Security Measures:** CORS misconfigured, no request validation

### Deployment & Infrastructure
- **Containerization:** Direct Node.js deployment
- **CI/CD:** Manual server updates
- **Cloud Provider:** VPS Instance
- **Storage:** S3


