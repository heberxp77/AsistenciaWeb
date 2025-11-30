# University Attendance Management System

## Overview

This is a comprehensive university attendance management system built with React, Express, and Firebase. The application provides role-based access for administrators, teachers, and area managers to manage campuses, schools, programs, student groups, and track attendance records. It's designed with Material Design principles to prioritize efficiency and data management in an academic environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query for server state management and caching

**UI Component System:**
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Material Design principles with professional academic customization
- Theme system supporting light/dark modes via ThemeContext

**State Management:**
- React Context API for global state (AuthContext, ThemeContext)
- TanStack Query for server state and caching
- Local component state with React hooks

**Design System:**
- Custom Tailwind configuration with HSL-based color system
- Consistent spacing scale (2, 4, 6, 8 units)
- Typography hierarchy using Inter font family
- Responsive layout with sidebar navigation pattern

### Backend Architecture

**Server Framework:**
- Express.js as the web server
- TypeScript for type safety across the stack
- HTTP server created with Node's built-in http module
- Modular route registration system

**Code Organization:**
- `/server` - Backend logic and API routes
- `/client` - React frontend application
- `/shared` - Shared types and schemas between frontend and backend
- Monorepo structure with shared TypeScript configuration

**Build Process:**
- esbuild for server bundling with selective dependency bundling
- Vite for client bundling with HMR support
- Separate production and development builds
- Server dependencies allowlisted for bundling to optimize cold start times

### Authentication & Authorization

**Firebase Authentication:**
- Google OAuth provider for user sign-in
- Firebase Auth redirect flow for authentication
- Role-based access control (RBAC) with three roles:
  - `admin` - Full system access
  - `teacher` - Manage assigned groups and attendance
  - `area_manager` - View reports and analytics

**User Management:**
- User profiles stored in Firestore with role information
- Protected routes based on user roles
- Automatic user document creation on first login
- Session persistence via Firebase Auth

### Data Architecture

**Firestore Database Schema:**
- **users** - User profiles with roles and metadata
- **campuses** - University campus locations
- **schools** - Academic schools within campuses
- **programs** - Degree programs within schools
- **classGroups** - Student groups/sections with assigned teachers
- **students** - Student records linked to groups
- **attendance** - Attendance records with timestamps and status
- **justifications** - Absence justification requests

**Data Model Characteristics:**
- Denormalized structure optimized for read performance
- Document references linking related entities
- Hierarchical relationship: Campus → School → Program → Group → Students
- Active/inactive flags for soft deletion
- Timestamp tracking for audit trails

**Data Validation:**
- Zod schemas defined in `/shared/schema.ts`
- Type inference from Zod schemas for TypeScript types
- Client-side validation with React Hook Form
- Shared validation logic between client and server

### External Dependencies

**Firebase Services:**
- **Firebase Authentication** - User authentication with Google OAuth
- **Cloud Firestore** - NoSQL document database for all application data
- **Cloud Storage** - File storage for user photos and documents

**Database Configuration:**
- Drizzle ORM configured for PostgreSQL (via drizzle.config.ts)
- Neon serverless PostgreSQL driver included
- Migration support via Drizzle Kit
- Note: Current implementation uses Firebase, but infrastructure exists for potential PostgreSQL migration

**Third-Party UI Libraries:**
- Radix UI - Accessible component primitives
- Lucide React - Icon library
- date-fns - Date manipulation and formatting
- cmdk - Command palette component
- Embla Carousel - Carousel component
- Vaul - Drawer component

**Development Tools:**
- Replit-specific plugins for development experience
- Runtime error overlay for debugging
- Cartographer for code navigation
- Development banner

**Form Management:**
- React Hook Form for form state management
- Hookform resolvers for Zod schema integration
- Client-side validation before submission

### Routing Architecture

**Client-Side Routing:**
- Wouter for declarative routing
- Role-based protected routes
- Route guards checking authentication and authorization
- Automatic redirects based on user role:
  - Admin → `/admin`
  - Teacher → `/teacher`
  - Area Manager → `/manager`

**Route Structure:**
- `/login` - Authentication page
- `/admin/*` - Administrator routes (campuses, schools, programs, groups, teachers, students)
- `/teacher/*` - Teacher routes (groups, attendance, justifications)
- `/manager/*` - Area manager routes (reports, analytics)