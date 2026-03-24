# SoulSupport Backend API

## Overview

Backend API for SoulSupport online therapy platform built with Node.js, Express, and MongoDB.

## Features

- User authentication (JWT)
- Therapist profiles and discovery
- Session booking and management
- Community forum with posts and comments
- Review system
- Real-time notifications
- File upload (Cloudinary)
- Email notifications

## Prerequisites

- Node.js 22 LTS recommended
- MongoDB (local or Atlas)
- Cloudinary account
- Email service (Gmail or SendGrid)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development server:

```bash
npm run dev
```

4. Start production server:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Forum

- `GET /api/forum/posts` - Get all posts
- `POST /api/forum/posts` - Create post
- `GET /api/forum/posts/:id` - Get single post
- `DELETE /api/forum/posts/:id` - Delete post
- `POST /api/forum/posts/:id/like` - Like post
- `DELETE /api/forum/posts/:id/like` - Unlike post
- `POST /api/forum/posts/:id/comments` - Add comment

### Therapists

- `GET /api/therapists` - Get all therapists
- `GET /api/therapists/:id` - Get therapist profile
- `PUT /api/therapists/:id` - Update therapist profile
- `POST /api/therapists/:id/photo` - Upload therapist photo
- `GET /api/therapists/:id/reviews` - Get therapist reviews
- `GET /api/therapists/:id/availability` - Check availability

### Sessions

- `GET /api/sessions` - Get user/therapist sessions
- `POST /api/sessions` - Book a session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id/status` - Update session status
- `DELETE /api/sessions/:id` - Cancel session

### Reviews

- `POST /api/reviews` - Create review
- `GET /api/reviews/therapist/:therapistId` - Get therapist reviews

### Notifications

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## Project Structure

```
src/
├── config/          # Configuration files
├── models/          # Mongoose models
├── controllers/     # Route controllers
├── routes/          # API routes
├── middlewares/     # Custom middlewares
├── validators/      # Request validators
├── services/        # Business logic services
├── utils/           # Utility functions
├── app.js           # Express app setup
└── server.js        # Server entry point
```

## Environment Variables

See `.env.example` for required environment variables.

## Testing

```bash
npm test
```

## License

MIT
