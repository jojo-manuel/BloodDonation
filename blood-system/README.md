# Blood Bank Management Platform - Backend

A production-ready, containerized backend system for Hospital/Blood Bank Management using a modular service architecture with API Gateway pattern, RBAC, and multi-tenant support.

## 🏗️ Architecture Overview

This system follows a **Containerized Modular Service Architecture** where:
- Each container represents **ONE business capability** (not user roles)
- Services communicate **ONLY via REST APIs**
- Each service owns its **own MongoDB database**
- **API Gateway** handles authentication, authorization, and routing
- **RBAC** is enforced at the gateway level
- **Multi-tenant** with hospital_id based isolation

```
┌─────────────────────────────────────────────────────────────┐
│                        API GATEWAY                          │
│            (JWT Verification + RBAC Enforcement)            │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼─────┐        ┌─────▼─────┐
   │  Auth   │          │   Donor   │        │ Inventory │
   │ Service │          │  Service  │        │  Service  │
   └────┬────┘          └─────┬─────┘        └─────┬─────┘
        │                     │                     │
   ┌────▼────┐          ┌─────▼─────┐        ┌─────▼─────┐
   │ Auth DB │          │ Donor DB  │        │Inventory  │
   └─────────┘          └───────────┘        │    DB     │
                                             └───────────┘
        ┌─────────────────────┐
        │   Request Service   │◄──── REST API ────┐
        └──────────┬──────────┘                   │
                   │                              │
              ┌────▼────┐                  (Inventory Check)
              │Request  │
              │   DB    │
              └─────────┘

Optional Services (can be disabled):
┌──────────────┐  ┌──────────┐  ┌─────────┐
│ Notification │  │   IoT    │  │ Ledger  │
│   Service    │  │ Service  │  │ Service │
└──────────────┘  └──────────┘  └─────────┘
```

## 📦 Services

### Core Services (Required)

#### 1. **Gateway Service** (Port 3000)
- Single entry point for all API requests
- JWT token verification
- RBAC enforcement (DONOR, DOCTOR, BLOODBANK_ADMIN)
- Request routing to backend services
- Centralized error handling and logging

#### 2. **Auth Service** (Port 3001)
- User registration and login
- JWT token generation
- Password hashing with bcrypt
- Roles: DONOR, DOCTOR, BLOODBANK_ADMIN
- Own MongoDB database

#### 3. **Donor Service** (Port 3002)
- Donor profile management
- Eligibility checking (age, health, last donation)
- Hospital-based data isolation
- Own MongoDB database

#### 4. **Inventory Service** (Port 3003)
- Blood unit management
- Blood group tracking (A+, A-, B+, B-, AB+, AB-, O+, O-)
- Expiry date tracking
- Availability queries
- Own MongoDB database

#### 5. **Request Service** (Port 3004)
- Blood request creation and management
- Request approval/rejection workflow
- Integration with Inventory Service (REST API)
- Own MongoDB database

### Optional Services

#### 6. **Notification Service** (Port 3005) - Optional
- SMS/Email abstraction layer
- Triggered via REST API
- No database required

#### 7. **IoT Service** (Port 3006) - Optional
- Sensor data collection (temperature, centrifuge)
- Own MongoDB database

#### 8. **Ledger Service** (Port 3007) - Optional
- Audit logging / blockchain abstraction
- Stores transaction hashes only
- Other services remain unaware of blockchain
- Own MongoDB database

## 🔐 RBAC Rules

### DONOR
- ✅ Create blood requests
- ✅ View own request status
- ❌ Cannot manage inventory
- ❌ Cannot approve requests

### DOCTOR
- ✅ View inventory
- ✅ Create blood requests
- ❌ Cannot manage donors
- ❌ Cannot approve requests

### BLOODBANK_ADMIN
- ✅ Manage donors (CRUD)
- ✅ Manage inventory (CRUD)
- ✅ Approve/reject blood requests
- ✅ Trigger notifications
- ✅ Full access to all resources

## 🏥 Multi-Hospital Isolation

Every request must include `hospital_id` in:
- JWT token payload
- Database queries
- API requests

**Isolation Rules:**
- Users can only access data from their own hospital
- `hospital_id` is enforced in all MongoDB queries
- Cross-hospital data access is prevented at the database level

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### Quick Start

1. **Clone and navigate to the project:**
   ```bash
   cd blood-system
   ```

2. **Start all core services:**
   ```bash
   docker-compose up -d
   ```

3. **Start with optional services:**
   ```bash
   docker-compose --profile optional up -d
   ```

4. **Check service health:**
   ```bash
   curl http://localhost:3000/health
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMS_API_KEY=your-sms-api-key
```

## 📡 API Routes

### Authentication (via Gateway)

```bash
# Register
POST http://localhost:3000/api/auth/register
{
  "email": "admin@hospital1.com",
  "password": "securepass123",
  "name": "John Admin",
  "role": "BLOODBANK_ADMIN",
  "hospital_id": "hospital1"
}

# Login
POST http://localhost:3000/api/auth/login
{
  "email": "admin@hospital1.com",
  "password": "securepass123"
}
```

### Donor Management (Admin only)

```bash
# Create donor
POST http://localhost:3000/api/donors
Authorization: Bearer <JWT_TOKEN>
{
  "name": "Jane Donor",
  "blood_group": "O+",
  "contact": "+1234567890",
  "age": 25,
  "hospital_id": "hospital1"
}

# List donors
GET http://localhost:3000/api/donors
Authorization: Bearer <JWT_TOKEN>
```

### Inventory Management (Admin only)

```bash
# Add blood units
POST http://localhost:3000/api/inventory
Authorization: Bearer <JWT_TOKEN>
{
  "blood_group": "O+",
  "quantity": 5,
  "expiry_date": "2025-12-31",
  "hospital_id": "hospital1"
}

# Check availability
GET http://localhost:3000/api/inventory/availability?blood_group=O+
Authorization: Bearer <JWT_TOKEN>
```

### Blood Requests (Donor, Doctor, Admin)

```bash
# Create request
POST http://localhost:3000/api/requests
Authorization: Bearer <JWT_TOKEN>
{
  "blood_group": "O+",
  "quantity": 2,
  "urgency": "high",
  "hospital_id": "hospital1"
}

# Approve request (Admin only)
PUT http://localhost:3000/api/requests/:id/approve
Authorization: Bearer <JWT_TOKEN>
```

## 🛠️ Development

### Running Services Individually

Each service can be run independently for development:

```bash
cd auth-service
npm install
npm run dev
```

### Service Structure

Each service follows this structure:
```
service-name/
├── server.js           # Express app entry point
├── models/             # MongoDB schemas
├── routes/             # API routes
├── middleware/         # Custom middleware
├── services/           # Business logic
├── Dockerfile          # Container definition
├── package.json        # Dependencies
└── .env.example        # Environment template
```

## 🧪 Testing

### Health Checks

```bash
# Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:3001/health

# Donor Service
curl http://localhost:3002/health

# Inventory Service
curl http://localhost:3003/health

# Request Service
curl http://localhost:3004/health
```

### Test Multi-Tenant Isolation

```bash
# Register users for different hospitals
# Hospital 1 Admin
POST http://localhost:3000/api/auth/register
{
  "email": "admin1@hospital1.com",
  "password": "pass123",
  "role": "BLOODBANK_ADMIN",
  "hospital_id": "hospital1"
}

# Hospital 2 Admin
POST http://localhost:3000/api/auth/register
{
  "email": "admin2@hospital2.com",
  "password": "pass123",
  "role": "BLOODBANK_ADMIN",
  "hospital_id": "hospital2"
}

# Verify hospital1 admin cannot access hospital2 data
```

## 🔧 Enabling/Disabling Optional Services

### Disable Optional Services (Default)
```bash
docker-compose up -d
```

### Enable Optional Services
```bash
docker-compose --profile optional up -d
```

### Enable Specific Optional Service
Edit `docker-compose.yml` and remove the `profiles` section from the desired service.

## 📊 Database Schema Overview

### Auth Service - Users Collection
```javascript
{
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String (DONOR | DOCTOR | BLOODBANK_ADMIN),
  hospital_id: String,
  createdAt: Date
}
```

### Donor Service - Donors Collection
```javascript
{
  name: String,
  blood_group: String,
  contact: String,
  age: Number,
  last_donation_date: Date,
  eligibility_status: Boolean,
  hospital_id: String,
  createdAt: Date
}
```

### Inventory Service - BloodUnits Collection
```javascript
{
  blood_group: String,
  quantity: Number,
  expiry_date: Date,
  status: String (available | reserved | expired),
  hospital_id: String,
  createdAt: Date
}
```

### Request Service - Requests Collection
```javascript
{
  requester_id: String,
  blood_group: String,
  quantity: Number,
  urgency: String (low | medium | high),
  status: String (pending | approved | rejected | fulfilled),
  hospital_id: String,
  createdAt: Date
}
```

## 🐳 Docker Commands

```bash
# Build all services
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Restart a specific service
docker-compose restart gateway
```

## 🔒 Security Best Practices

1. **Change JWT_SECRET** in production
2. **Use strong passwords** for MongoDB in production
3. **Enable HTTPS** with reverse proxy (nginx/traefik)
4. **Rate limiting** at gateway level
5. **Input validation** in all services
6. **Regular security updates** for dependencies

## 📝 License

MIT

## 🤝 Contributing

This is a beginner-friendly, production-ready template. Feel free to extend and customize based on your needs.

## 📞 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ for Healthcare**
