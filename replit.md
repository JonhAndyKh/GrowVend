# Grow4Bot Gaming Marketplace

## Overview

Grow4Bot is a gaming marketplace application for buying and selling digital goods and game items. The platform features user authentication, a wallet system with virtual currency, product browsing and purchasing, and an admin panel for managing products and users.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite

The frontend follows a page-based structure with shared components. Authentication state is managed via React Context (`AuthProvider`), and the app uses a sidebar-based layout (`AppLayout`) for authenticated users.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful endpoints under `/api/*`
- **Session Management**: express-session with MongoDB session store (connect-mongo)
- **Password Hashing**: bcrypt

The server handles authentication, product management, wallet transactions, and purchases. Routes are registered in `server/routes.ts` with middleware for authentication checks.

### Data Storage
- **Primary Database**: MongoDB via Mongoose ODM
- **Schema Location**: `shared/schema.ts` contains both Mongoose models and Zod validation schemas
- **Collections**: Users, Products, Purchases, Transactions

Note: The project also contains Drizzle ORM configuration (`drizzle.config.ts`) for PostgreSQL, but the active implementation uses MongoDB. The Drizzle setup may be for future migration or was part of an earlier iteration.

### Authentication & Authorization
- Session-based authentication stored in MongoDB
- User roles: Regular users and Admins (controlled via `isAdmin` flag)
- Admin-only routes protected by checking user role
- Ban system for blocking users (`isBanned` flag)

### Key Data Models
- **User**: email, password (hashed), balance, isAdmin, isBanned
- **Product**: name, description, price, image, stockData (array of items), category
- **Purchase**: userId, productId, productName, price, stockData (single item from product)
- **Transaction**: userId, type, amount, description (tracks wallet activity)

### Build & Deployment
- Development: `tsx` for running TypeScript directly
- Production build: Custom build script using esbuild (server) and Vite (client)
- Deployment target: Vercel (serverless functions via `api/index.ts`)
- Static files served from `dist/public`

## External Dependencies

### Database
- **MongoDB**: Primary database, connection via `MONGODB_URI` environment variable
- **connect-mongo**: Session store adapter for Express sessions

### Core Libraries
- **Mongoose**: MongoDB ODM for data modeling
- **Zod**: Runtime type validation for API inputs
- **bcrypt**: Password hashing
- **express-session**: Session management

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **Radix UI**: Accessible component primitives (dialog, dropdown, toast, etc.)
- **Tailwind CSS**: Utility-first styling
- **react-hook-form**: Form handling with Zod resolver
- **date-fns**: Date formatting
- **lucide-react**: Icon library

### Environment Variables Required
- `MONGODB_URI`: MongoDB connection string
- `SESSION_SECRET`: Secret for session encryption (optional, has fallback)
- `DATABASE_URL`: PostgreSQL URL (for Drizzle, if used)