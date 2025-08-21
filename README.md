# Appraisal App Frontend

React + Vite frontend for the Appraisal Report Management System.

## Quick Start

```bash
npm install
npm run dev
```

Application runs at: http://localhost:5173

## Environment Setup

Create `.env` file:
```env
VITE_API_URL=http://localhost:8000
```

## Features

- **Authentication**: Login with username/email, signup, email verification
- **Role-based Access**: Admin, Appraiser, Client with different permissions
- **Form Handling**: Smart field preservation on errors

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components (Login, Signup, Dashboard, etc.)
├── services/      # API calls and axios configuration
├── context/       # Authentication state management
└── hooks/         # Custom hooks (useToast)
```

## User Roles

| Feature | Admin | Appraiser | Client |
|---------|-------|-----------|--------|
| Dashboard | ✅ | ✅ | ✅ |
| Properties | ✅ | ✅ | ❌ |
| Appraisals | ✅ | ✅ | ✅ (view) |
| Users Management | ✅ | ❌ | ❌ |

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview build