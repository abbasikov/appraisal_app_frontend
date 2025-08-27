# Appraisal Report Management System - Frontend

React + Vite frontend with Tailwind CSS, authentication, and project management.

## Quick Start

### Prerequisites
- Node.js 16+
- Backend API running on port 8000

### Setup
```bash
# Navigate to frontend
cd appraisal-app-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if needed (default should work)

# Start development server
npm run dev
```

## Configuration

### Environment Variables (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME="Appraisal Report Management"
```

## Features

### Authentication
- Login with username/password
- Two-factor authentication (TOTP)
- Role-based access control
- Email verification for new users

### Project Management
- Create and manage projects
- Link clients to projects
- Assign users to projects
- Track project status and progress

### Dropbox Integration
- Add Dropbox shared folder links
- Import photos from shared folders
- View photo thumbnails and metadata
- Delete imported photos

### Client Management
- Create and edit client information
- Store contact details and case information
- Link multiple projects to clients

## User Roles

- **Admin**: Full system access, user management
- **Editor**: Create/edit projects and clients
- **Reader**: View-only access

## Pages

- `/login` - User authentication
- `/dashboard` - Main dashboard
- `/clients` - Client management
- `/projects` - Project list
- `/projects/:id` - Project details with Dropbox integration
- `/settings` - User settings and MFA setup

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure
```
src/
├── components/      # Reusable components
├── pages/          # Page components
├── services/       # API services
├── context/        # React context
├── utils/          # Utility functions
└── App.jsx         # Main app component
```

### Key Components
- `Layout` - Main layout with navigation
- `DropboxLinksManager` - Dropbox folder management
- `PhotoTable` - Photo display with thumbnails
- `ProtectedRoute` - Route protection by role

## API Integration

### Services
- `authService` - Authentication and user management
- `clientService` - Client operations
- `projectService` - Project and photo operations

### Authentication
All API requests include JWT token in Authorization header.
