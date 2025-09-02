# Appraisal Report Management System - Frontend

React + Vite frontend with Tailwind CSS, authentication, project management, and user management.

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

### User Management (Admin/Editor)
- Invite users with email notifications
- Role management and permissions
- Password setup flow for invited users
- User deletion with proper access control

### Project Management
- Create and manage projects
- Link clients to projects
- Assign users to projects
- Track project status and progress

### Dropbox Integration
- Add up to 10 Dropbox shared folder links per project
- Import photos from shared folders and subfolders
- View photo thumbnails with folder path information
- Photos sorted chronologically by EXIF date
- Delete imported photos

### Client Management
- Create and edit client information
- Store contact details and case information
- Link multiple projects to clients

## User Roles

- **Admin**: Full system access, user management, role changes
- **Editor**: Create/edit projects and clients, invite Editor/Reader users
- **Reader**: View-only access

## Pages

- `/login` - User authentication
- `/setup-password` - Password setup for invited users
- `/dashboard` - Main dashboard
- `/users` - User management (Admin/Editor only)
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
- `PhotoTable` - Photo display with thumbnails and folder paths
- `UserManagement` - User invitation and management
- `ProtectedRoute` - Route protection by role

## API Integration

### Services
- `authService` - Authentication and user management
- `userService` - User invitation and management
- `clientService` - Client operations
- `projectService` - Project and photo operations

### Authentication
All API requests include JWT token in Authorization header.

## Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
- Update `VITE_API_URL` to production backend URL
- Configure web server to serve static files
- Set up SSL certificates
- Configure CDN for better performance