# SoulSupport

An online therapy and mental wellness platform connecting users with licensed therapists, featuring AI-powered support, community forums, and session management.

## Features

- **User Authentication** - Secure JWT-based registration, login, and password recovery
- **Therapist Discovery** - Browse and search licensed therapists by specialty
- **Session Booking** - Schedule and manage therapy appointments
- **AI Chatbot (SoulBot)** - Mental health support chatbot powered by AI
- **Community Forum** - Peer support with posts, comments, and likes
- **Reviews & Ratings** - Rate and review therapist sessions
- **Real-time Notifications** - Stay updated on sessions and messages
- **Admin Dashboard** - Platform management and analytics

## Tech Stack

**Frontend:**

- Next.js 16 with App Router
- React 19
- Tailwind CSS 3
- TanStack Query for data fetching
- Framer Motion for animations

**Backend:**

- Node.js with Express 5
- MongoDB with Mongoose
- JWT authentication
- Cloudinary for media uploads
- Nodemailer for emails

**DevOps:**

- Docker & Docker Compose
- Nginx reverse proxy
- Jest for testing

## Project Structure

```
soulsupport/
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and API client
│   └── public/            # Static assets
├── backend/               # Express API server
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Express middlewares
│   │   ├── services/      # Business logic
│   │   ├── validators/    # Request validation
│   │   └── utils/         # Helper functions
│   └── tests/             # Backend tests
├── scripts/               # Build and utility scripts
├── docker-compose.yml     # Docker orchestration
└── nginx.conf             # Nginx configuration
```

## Prerequisites

- Node.js 22 LTS
- MongoDB (local or Atlas)
- npm or yarn

Optional:

- Docker & Docker Compose (for containerized deployment)
- Cloudinary account (for image uploads)
- SMTP server (for email notifications)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/soulsupport.git
cd soulsupport
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
npm --prefix frontend install

# Install backend dependencies
npm --prefix backend install
```

### 3. Configure environment variables

**Backend** (`backend/.env`):

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

**Frontend** (`frontend/.env.local`):

```bash
cp frontend/.env.local.example frontend/.env.local
# Edit frontend/.env.local with your configuration
```

### 4. Start development servers

```bash
# Start both frontend and backend
npm run dev:frontend    # Frontend on http://localhost:3000
npm run dev:backend     # Backend on http://localhost:5000
```

Or run them separately:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## Docker Deployment

### Quick Start with Docker Compose

1. Copy the deployment environment file:

```bash
cp .env.deploy.example .env
# Edit .env with your production secrets
```

2. Build and start services:

```bash
docker compose up -d
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5007/api
   - Nginx Proxy: http://localhost:80

### Services

| Service  | Port  | Description            |
| -------- | ----- | ---------------------- |
| frontend | 3000  | Next.js application    |
| backend  | 5007  | Express API server     |
| mongodb  | 27017 | MongoDB database       |
| redis    | 6379  | Redis cache (optional) |
| nginx    | 80    | Reverse proxy          |

## Environment Variables

### Backend

| Variable                | Description                    | Default                 |
| ----------------------- | ------------------------------ | ----------------------- |
| `NODE_ENV`              | Environment mode               | `development`           |
| `PORT`                  | Server port                    | `5000`                  |
| `MONGODB_URI`           | MongoDB connection string      | -                       |
| `JWT_SECRET`            | JWT signing secret (32+ chars) | -                       |
| `JWT_EXPIRES_IN`        | JWT expiration                 | `7d`                    |
| `EMAIL_HOST`            | SMTP host                      | `smtp.gmail.com`        |
| `EMAIL_PORT`            | SMTP port                      | `587`                   |
| `EMAIL_USER`            | SMTP username                  | -                       |
| `EMAIL_PASS`            | SMTP password                  | -                       |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name          | -                       |
| `CLOUDINARY_API_KEY`    | Cloudinary API key             | -                       |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret          | -                       |
| `FRONTEND_URL`          | Frontend URL for CORS          | `http://localhost:3000` |

### Frontend

| Variable                      | Description             | Default                     |
| ----------------------------- | ----------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL`         | Public API URL          | `http://localhost:5000/api` |
| `NEXT_PUBLIC_APP_URL`         | Public app URL          | `http://localhost:3000`     |
| `API_URL`                     | Server-side API URL     | `http://localhost:5000/api` |
| `OPENROUTER_API_KEY`          | AI chatbot API key      | -                           |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | n8n webhook for SoulBot | -                           |

## API Documentation

See [backend/README.md](backend/README.md) for complete API endpoint documentation.

### Key Endpoints

| Endpoint             | Method   | Description       |
| -------------------- | -------- | ----------------- |
| `/api/auth/register` | POST     | User registration |
| `/api/auth/login`    | POST     | User login        |
| `/api/therapists`    | GET      | List therapists   |
| `/api/sessions`      | POST     | Book a session    |
| `/api/forum/posts`   | GET/POST | Forum posts       |

## Testing

```bash
# Run all tests
npm test

# Run backend tests with coverage
npm --prefix backend run test

# Run frontend tests
npm --prefix frontend run test

# Watch mode
npm --prefix frontend run test:watch
```

## Scripts

| Script                 | Description                     |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Start frontend dev server       |
| `npm run dev:frontend` | Start frontend dev server       |
| `npm run dev:backend`  | Start backend dev server        |
| `npm run build`        | Build both frontend and backend |
| `npm run test`         | Run all tests                   |
| `npm run lint`         | Lint frontend code              |

## Demo Credentials

For testing purposes:

- **Email:** admin@gmail.com
- **Password:** 12345678

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
