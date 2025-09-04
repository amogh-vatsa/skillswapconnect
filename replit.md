# SkillSwap Platform

## Overview

SkillSwap is a full-stack web platform that enables users to exchange skills and knowledge through a secure, authenticated system. The application connects talented individuals who want to learn new skills while teaching what they know best. Users can create skill profiles, browse available skills, engage in conversations, and participate in video calls for skill exchanges.

The platform serves as a marketplace for knowledge exchange, facilitating peer-to-peer learning through structured interactions. It includes comprehensive user management, skill categorization, real-time messaging, and video communication capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with conditional rendering based on authentication state
- **State Management**: TanStack React Query for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **Component Structure**: Modular component architecture with reusable UI components and feature-specific components

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful API with comprehensive error handling and request logging middleware
- **Session Management**: Express sessions with PostgreSQL-based session storage
- **WebSocket Support**: WebSocket server integration for real-time features

### Authentication System
- **Provider**: Replit OAuth integration using OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Security**: HTTP-only cookies with secure flags and CSRF protection
- **Middleware**: Custom authentication middleware for protected routes

### Data Architecture
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Data Models**: Comprehensive schema covering users, skills, conversations, messages, exchanges, and ratings

### Key Features
- **Skill Management**: CRUD operations for user skills with categorization and search
- **User Profiles**: Rich user profiles with ratings, statistics, and skill portfolios  
- **Messaging System**: Real-time conversations between users
- **Video Calling**: Integrated video call functionality for skill exchanges
- **Skill Exchange Tracking**: System for managing and tracking skill exchange requests and completion
- **Rating System**: User rating and feedback system for quality assurance

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database hosting with connection pooling
- **PostgreSQL**: Primary database engine with JSONB support for flexible data storage

### Authentication Services
- **Replit Auth**: OpenID Connect authentication provider for secure user authentication
- **Passport.js**: Authentication middleware with OpenID Connect strategy

### Frontend Libraries
- **Radix UI**: Comprehensive component library for accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework for responsive styling
- **TanStack React Query**: Powerful data synchronization library for React applications
- **React Hook Form**: Forms library with validation using Zod schemas
- **Wouter**: Lightweight routing library for React applications

### Development Tools
- **Vite**: Fast build tool with hot module replacement and development server
- **TypeScript**: Type safety across the entire application stack
- **Drizzle Kit**: Database toolkit for migrations and schema management
- **ESBuild**: Fast JavaScript bundler for production builds

### Utility Libraries
- **Zod**: TypeScript-first schema validation library
- **date-fns**: Modern JavaScript date utility library
- **Lucide React**: Icon library with React components
- **clsx & tailwind-merge**: Utility functions for conditional CSS classes