# QueztLearn Service

A production-ready Node.js backend service built with TypeScript, Express, and PostgreSQL. Features include user authentication, email verification, organization management, and comprehensive API documentation with Swagger.

## 🚀 Features

- **TypeScript** - Type-safe backend development
- **Express 5** - Modern web framework with async error handling
- **Drizzle ORM** - Type-safe database queries with PostgreSQL
- **Authentication** - Complete JWT-based auth flow with email verification
- **Email Service** - Resend integration for transactional emails
- **API Documentation** - Interactive Swagger/OpenAPI documentation
- **Docker Support** - Containerized deployment ready
- **Render Deployment** - Pre-configured for Render.com deployment

## 📋 Prerequisites

- Node.js 20+ (or use nvm)
- PostgreSQL 14+ (local or cloud)
- npm/pnpm/yarn
- (Optional) Docker for containerized setup

## 🛠️ Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/Quezt-Labs/queztlearn-svc.git
cd queztlearn-svc
npm install
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/queztlearn
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=your-email@example.com
FRONTEND_URL=http://localhost:3001
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Database Setup

Push the schema to your database:

```bash
pnpm drizzle-kit push
```

### 4. Run Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## 📚 API Documentation

Once the server is running, access the interactive API documentation:

**Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### Available Endpoints

#### Authentication (`/admin/auth`)

- `POST /admin/auth/register` - Register new user
- `POST /admin/auth/verify-email` - Verify email with token
- `POST /admin/auth/set-password` - Set password after verification
- `POST /admin/auth/resend-verification` - Resend verification email
- `POST /admin/auth/login` - Login and get JWT token

#### Organizations (`/admin/organizations`)

- `POST /admin/organizations` - Create new organization

#### System

- `GET /health-check` - Server health status

## 🏗️ Project Structure

```
queztlearn-svc/
├── src/
│   ├── common/           # Shared utilities
│   │   ├── constants.ts  # HTTP status codes, error messages
│   │   └── response.ts   # ApiError and ApiResponse classes
│   ├── config/           # Configuration files
│   │   └── swagger.ts    # OpenAPI/Swagger configuration
│   ├── db/              # Database layer
│   │   ├── index.ts     # Database connection
│   │   └── schema.ts    # Drizzle ORM schemas
│   ├── middlewares/     # Express middlewares
│   │   └── async-handler.ts
│   ├── routes/          # API routes
│   │   ├── admin.ts     # Admin router
│   │   ├── auth.route.ts
│   │   └── organization.route.ts
│   ├── services/        # Business logic
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   └── organization.service.ts
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript (generated)
├── .env                 # Environment variables (git-ignored)
├── .env.example         # Example environment file
├── docker-compose.yml   # Docker Compose for local PostgreSQL
├── Dockerfile          # Production Docker image
├── drizzle.config.ts   # Drizzle ORM configuration
├── render.yaml         # Render deployment configuration
├── package.json
├── tsconfig.json
└── README.md
```

## 🗄️ Database Schema

### Tables

- **organization** - Organizations with unique names
- **user** - Users with email verification and roles (ADMIN/USER)
- **verification_token** - JWT tokens for email verification

## 🔧 Scripts

```bash
npm run dev          # Development with hot reload (tsx)
npm run build        # Compile TypeScript to JavaScript
npm start            # Run production build
pnpm drizzle-kit push     # Push schema changes to database
pnpm drizzle-kit studio   # Open Drizzle Studio (database GUI)
```

## 🐳 Docker Deployment

### Using Docker Compose (Development)

```bash
docker-compose up -d
```

This starts PostgreSQL with persistent volume.

### Production Docker Build

```bash
docker build -t queztlearn-svc .
docker run -p 3000:3000 --env-file .env queztlearn-svc
```

## ☁️ Deploying to Render

See detailed deployment guide: [DEPLOY.md](./DEPLOY.md)

**Quick Start:**

1. Push code to GitHub
2. Connect repository to Render
3. Render auto-detects `render.yaml`
4. Set environment variables in Render dashboard
5. Deploy!

Your API will be live at: `https://your-service.onrender.com`

## 🔐 Security

- JWT tokens: 24h for verification, 7d for sessions
- Passwords: bcrypt hashing with 10 salt rounds
- Email verification required before login
- Environment variables for sensitive data
- HTTPS recommended for production

## 🧪 Authentication Flow

1. **Register**: User provides email, username, organization
2. **Verify Email**: User clicks link in email with JWT token
3. **Set Password**: User sets password after verification
4. **Login**: User logs in with email/password, receives session JWT

See [AUTH_FLOW.md](./AUTH_FLOW.md) for detailed documentation.

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.9
- **Framework**: Express 5.1
- **Database**: PostgreSQL 14+ (with Drizzle ORM 0.44)
- **Authentication**: JWT (jsonwebtoken 9.0)
- **Email**: Resend 6.2
- **Password**: bcrypt 6.0
- **API Docs**: Swagger UI + swagger-jsdoc
- **Dev Tools**: tsx (hot reload), drizzle-kit

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

ISC

## 📧 Support

For issues and questions:

- GitHub Issues: https://github.com/Quezt-Labs/queztlearn-svc/issues
- Email: gauharamir15@gmail.com

---

Built with ❤️ by Quezt Labs
