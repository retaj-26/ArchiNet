# ArchiNet Backend

Backend server untuk platform ArchiNet - Network Design & Simulation Platform.

## Setup & Installation

### Prerequisites
- Node.js v16+ 
- PostgreSQL v12+
- npm atau yarn

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Buat file `.env` dari `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi PostgreSQL Anda:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=archinet_db
DB_USER=archinet_user
DB_PASSWORD=your_secure_password
SERVER_PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 3. Create PostgreSQL Database

```sql
CREATE DATABASE archinet_db;
CREATE USER archinet_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE archinet_db TO archinet_user;
```

### 4. Run Database Migrations

```bash
npm run migrate
```

### 5. Start Server

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

Server akan berjalan di: `http://localhost:5000`

## API Endpoints

### Network Design Requests

**Submit Request**
```
POST /api/network/requests
Content-Type: application/json

{
  "projectType": "نوع المشروع",
  "buildingSize": "حجم المبنى",
  "floors": "عدد الطوابق",
  "usersCount": "عدد المستخدمين",
  "securityLevel": "مستوى الأمان",
  "vlanRequirements": "متطلبات VLAN",
  "projectDetails": "تفاصيل المشروع"
}
```

**Get All Requests (Admin)**
```
GET /api/network/requests
```

**Get Request Details**
```
GET /api/network/requests/:id
```

**Update Request Status (Admin)**
```
PATCH /api/network/requests/:id/status
Content-Type: application/json

{
  "status": "in_progress|completed|rejected"
}
```

### Support Tickets

**Submit Support Ticket**
```
POST /api/support/tickets
Content-Type: application/json

{
  "fullName": "الاسم الكامل",
  "phoneNumber": "+966501234567",
  "supportMessage": "نص الرسالة"
}
```

**Get All Tickets (Admin)**
```
GET /api/support/tickets
GET /api/support/tickets?status=open
```

**Get Ticket Details**
```
GET /api/support/tickets/:id
```

**Update Ticket (Admin)**
```
PATCH /api/support/tickets/:id
Content-Type: application/json

{
  "status": "open|in_progress|resolved|closed",
  "responseMessage": "رسالة الرد"
}
```

## Database Schema

### network_requests Table
- id (UUID)
- project_type
- building_size
- floors
- users_count
- security_level
- vlan_requirements
- project_details
- status (pending|in_progress|completed|rejected)
- created_at
- updated_at

### support_tickets Table
- id (UUID)
- ticket_number (unique)
- full_name
- phone_number
- support_message
- status (open|in_progress|resolved|closed)
- response_message
- created_at
- updated_at

## Architecture

```
backend/
├── config/
│   └── database.js          # Database connection
├── controllers/
│   ├── networkController.js  # Network request handlers
│   └── supportController.js  # Support ticket handlers
├── routes/
│   ├── networkRoutes.js      # Network API routes
│   └── supportRoutes.js      # Support API routes
├── middleware/
│   └── validators.js         # Input validation
├── migrations/
│   └── runMigrations.js      # Database migrations
├── server.js                # Express server
├── package.json
├── .env.example
└── README.md
```

## Features

✅ Incoming network design requests storage
✅ Support ticket management system
✅ Automatic ticket number generation
✅ Input validation with Joi
✅ PostgreSQL database integration
✅ RESTful API design
✅ CORS enabled for frontend
✅ Error handling & logging
✅ Health check endpoint

## Future Enhancements

- [ ] User authentication & authorization
- [ ] Admin dashboard API
- [ ] Email notifications
- [ ] File upload for configurations
- [ ] Advanced analytics
- [ ] Rate limiting
- [ ] Database backups
- [ ] API documentation (Swagger)

## License

MIT
