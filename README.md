# 🏗️ Forge India — Employee Portal System

A production-ready enterprise employee onboarding and management system.

## 🎨 Branding
- **Primary Color:** Navy Blue `#1A4FA0`
- **Accent Color:** Gold `#F5C518`
- **Logo:** F-bracket (blue) + pyramid (gold) + elephant icon

---

## 📁 Project Structure

```
forge-portal/
├── backend/               # Node.js + Express API
│   ├── config/            # DB & Cloudinary config
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Auth + validation
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── utils/             # JWT, email, helpers
│   └── server.js          # Entry point
│
└── frontend/              # React + Vite + Tailwind
    └── src/
        ├── components/    # Reusable UI
        ├── context/       # Auth context
        ├── pages/         # Route pages
        │   └── admin/     # Admin-only pages
        └── services/      # Axios API layer
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 32+ char secret for access tokens |
| `JWT_REFRESH_SECRET` | 32+ char secret for refresh tokens |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_HOST` | SMTP server (e.g. smtp.gmail.com) |
| `SMTP_USER` | Sender email address |
| `SMTP_PASS` | Email app password |
| `CLIENT_URL` | Frontend URL (e.g. http://localhost:5173) |

---

## 🔌 API Reference

### Auth
| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/invite` | Admin |
| GET | `/api/auth/validate-token?token=` | Public |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/refresh-token` | Public |
| POST | `/api/auth/logout` | Protected |
| GET | `/api/auth/me` | Protected |

### Employee
| Method | Route | Access |
|---|---|---|
| GET/POST/PUT | `/api/profile` | Employee |
| GET/POST/PUT/DELETE | `/api/education` | Employee |
| GET/POST/PUT/DELETE | `/api/experience` | Employee |
| GET | `/api/documents` | Employee |
| POST | `/api/documents/upload/:type` | Employee |

### Admin
| Method | Route | Access |
|---|---|---|
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/users` | Admin |
| GET | `/api/admin/user/:id` | Admin |
| PUT | `/api/admin/verify/:id` | Admin |
| GET | `/api/admin/activity-logs` | Admin |

---

## 🌐 Deployment

### Backend (Render / Railway / EC2)
```bash
npm start           # Production
npm run dev         # Development (nodemon)
```

### Frontend (Vercel / Netlify)
```bash
npm run build       # Creates dist/ folder
```

### MongoDB
Use **MongoDB Atlas** free tier — create cluster, whitelist IP, get connection string.

### Cloudinary
Free tier supports 25GB storage — sufficient for document uploads.

---

## 🔐 Security Features

- JWT access tokens (15 min) + refresh tokens (7 days)
- HttpOnly cookies for token storage
- bcrypt password hashing (12 salt rounds)
- Helmet security headers
- Rate limiting (100 req/15min global, 10 req/15min on auth)
- CORS restricted to CLIENT_URL
- Input validation with Joi
- Role-Based Access Control (RBAC)

---

## 👤 Default Admin Setup

After deployment, create an admin user directly in MongoDB:

```js
db.users.insertOne({
  name: "HR Admin",
  email: "admin@forge.in",
  password: "<bcrypt_hash>",  // hash with bcrypt
  role: "admin",
  isRegistered: true,
  status: "approved"
})
```

Or use a seed script (see `backend/utils/seed.js`).

---

## 📋 Onboarding Flow

```
Admin → Generate Invite → Email sent to employee
Employee → Clicks link → Registration page (/register?token=XYZ)
Employee → Sets password → Auto login → Dashboard
Employee → Fills Profile → Education → Experience → Documents
Admin → Reviews profile → Approve / Reject
Employee → Gets notified via email
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT (access + refresh), bcrypt |
| Storage | Cloudinary |
| Email | Nodemailer |
| Security | Helmet, CORS, Rate Limiting, Joi validation |
