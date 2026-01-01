# BuddiScript Server

Modern, scalable backend for a social/content platform built with Node.js, TypeScript, Express, MongoDB, and Socket.IO. Includes JWT auth, file uploads (S3), email/SMS integrations, payments (Stripe), and structured modules.

## Features

- JWT-based authentication with signup, login, password reset, and roles
- Social auth via Google and local credentials
- User profile management with image upload to S3
- Content modules: posts, comments, likes, shares, notifications
- Real-time Socket.IO with optional auth token handshake
- Structured validation with Zod and centralized error handling
- Email via SMTP and SMS via Twilio (optional)
- Stripe payment hooks (optional)

## Tech Stack

- Node.js, TypeScript, Express, Socket.IO
- MongoDB with Mongoose
- Zod for request validation
- Winston for logging
- AWS S3 via `@aws-sdk/client-s3` and `sharp` for image processing
- Passport (local, Google OAuth)

## Requirements

- Node.js 18+ and npm/yarn
- MongoDB instance (local or cloud)
- Optional: Redis (for queues/adapters), AWS S3, SMTP, Twilio, Stripe, Firebase

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` in the project root

   ```env

   ```

3. Start in development:
   ```bash
   npm run start
   ```
4. Build and run in production:
   ```bash
   npm run build
   npm run start:prod
   ```

## Scripts

- `npm run start`: Dev server with `ts-node-dev`
- `npm run build`: Compile TypeScript to `dist`
- `npm run start:prod`: Run compiled server
- `npm run lint:check`: ESLint analysis
- `npm run lint:fix`: ESLint auto-fix
- `npm run prettier:check`: Format files
- `npm run prettier:fix`: Format entire project
