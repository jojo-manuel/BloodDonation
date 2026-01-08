# Blood Donation System - Microservices Architecture

## Architecture Overview

This system uses a **separated backend architecture** where each frontend container has its own dedicated backend service.

```
┌─────────────────┐     ┌─────────────────┐
│  web-login      │────▶│  backend-login  │
│  (Port 3000)    │     │  (Port 5001)    │
└─────────────────┘     └─────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌─────────────────┐
│  web-admin      │────▶│  backend-admin  │
│  (Port 3001)    │     │  (Port 5002)    │
└─────────────────┘     └─────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌─────────────────┐
│  web-donor      │────▶│  backend-donor  │
│  (Port 3002)    │     │  (Port 5003)    │
└─────────────────┘     └─────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌─────────────────┐
│  web-bloodbank  │────▶│ backend-bloodbank│
│  (Port 3003)    │     │  (Port 5004)    │
└─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │    MongoDB      │
                        │   (blood-db)    │
                        └─────────────────┘
```

## Services

### Frontend Services (Nginx + React)

| Service | Port | Description |
|---------|------|-------------|
| `web-login` | 3000 | Login/Registration page |
| `web-admin` | 3001 | Admin Dashboard |
| `web-donor` | 3002 | Donor Dashboard |
| `web-bloodbank` | 3003 | Blood Bank Dashboard |

### Backend Services (Node.js + Express)

| Service | Port | Routes | Description |
|---------|------|--------|-------------|
| `backend-login` | 5001 | `/api/auth`, `/api/users` | Authentication & User management |
| `backend-admin` | 5002 | `/api/auth`, `/api/admin`, `/api/users` | Admin operations |
| `backend-donor` | 5003 | `/api/auth`, `/api/donors`, `/api/requests`, `/api/users` | Donor operations |
| `backend-bloodbank` | 5004 | `/api/auth`, `/api/bloodbank`, `/api/inventory`, `/api/donors`, `/api/requests`, `/api/notifications`, `/api/chat`, `/api/users` | Full blood bank operations |

### Database

| Service | Port | Description |
|---------|------|-------------|
| `blood-db` | 27017 (internal) | MongoDB 6 - Shared database |

## Quick Start

### Build and Run All Services
```bash
cd blood-system
docker-compose up --build
```

### Run in Detached Mode
```bash
docker-compose up -d --build
```

### Stop All Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend-login
```

## Access URLs

After starting the containers:

- **Login Page**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001
- **Donor Dashboard**: http://localhost:3002
- **Blood Bank Dashboard**: http://localhost:3003

### Backend Health Checks

- **Login Backend**: http://localhost:5001/health
- **Admin Backend**: http://localhost:5002/health
- **Donor Backend**: http://localhost:5003/health
- **BloodBank Backend**: http://localhost:5004/health

## Environment Variables

Each backend service uses these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://blood-db:27017/blood-monolith |
| `JWT_SECRET` | JWT signing secret | your-secret-key-change-in-production |
| `JWT_EXPIRES_IN` | Token expiration time | 24h |
| `FRONTEND_URL` | Allowed CORS origin | (varies per service) |

### BloodBank Backend Additional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | Email server host | smtp.gmail.com |
| `SMTP_PORT` | Email server port | 587 |
| `SMTP_USER` | Email username | - |
| `SMTP_PASS` | Email password | - |

## File Structure

```
blood-system/
├── backend-login/           # Login backend service
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js
│       └── server.js
├── backend-admin/           # Admin backend service
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js
│       └── server.js
├── backend-donor/           # Donor backend service
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js
│       └── server.js
├── backend-bloodbank/       # BloodBank backend service
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js
│       └── server.js
├── backend-monolith/        # Shared modules source
│   └── src/
│       ├── modules/         # Copied to each backend as needed
│       └── middleware/      # Shared auth middleware
├── nginx-configs/           # Nginx configs for each frontend
│   ├── nginx-login.conf
│   ├── nginx-admin.conf
│   ├── nginx-donor.conf
│   └── nginx-bloodbank.conf
└── docker-compose.yml       # Main orchestration file
```

## Benefits of This Architecture

1. **Isolation**: Each frontend has its own dedicated backend
2. **Scalability**: Scale individual services independently  
3. **Security**: Reduced attack surface per service
4. **Performance**: Smaller container footprint per service
5. **Maintenance**: Easier to update individual services
6. **Failure Isolation**: One service failure doesn't affect others
