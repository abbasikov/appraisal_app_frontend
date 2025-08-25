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
- **Two-Factor Authentication (2FA)**: OTP MFA with authenticator apps
- **Role-based Access**: Admin, Editor, Reader with different permissions
- **Form Handling**: Smart field preservation on errors
- **Security Settings**: Manage 2FA in Settings page

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

| Feature | Admin | Editor | Reader |
|---------|-------|--------|---------|
| Dashboard | ✅ | ✅ | ✅ |
| Properties | ✅ | ✅ | ❌ |
| Appraisals | ✅ | ✅ | ✅ (view) |
| Users Management | ✅ | ❌ | ❌ |
| 2FA Settings | ✅ | ✅ | ✅ |

## Two-Factor Authentication

- **Setup**: Scan QR code with Google Authenticator, Authy, or any TOTP app
- **Login**: Enter 6-digit code after username/password
- **Management**: Enable/disable in Settings page
- **Security**: Industry-standard TOTP protocol, works offline

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview build