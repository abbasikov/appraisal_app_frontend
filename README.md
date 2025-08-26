# Appraisal Report Frontend

React + Vite frontend for the Appraisal Report Management System with modern UI, role-based access control, and comprehensive client/project management.

## 🚀 Quick Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Backend API running on port 8000

### Installation
```bash
# Navigate to frontend directory
cd appraisal-app-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if needed (default should work)

# Start development server
npm run dev
```

### Access Application
- **Development**: http://localhost:5173
- **Backend API**: http://localhost:8000/docs

## 🔧 Configuration

### Environment Variables (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME="Appraisal Report Management"
```

### Build Configuration
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

## 📁 Project Structure

```
appraisal-app-frontend/
├── public/                  # Static assets
│   └── vite.svg
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout/
│   │   │   ├── Header.jsx   # Navigation header
│   │   │   ├── Sidebar.jsx  # Navigation sidebar
│   │   │   └── Layout.jsx   # Main layout wrapper
│   │   ├── UI/
│   │   │   ├── Button.jsx   # Custom button component
│   │   │   ├── Input.jsx    # Form input component
│   │   │   └── Modal.jsx    # Modal dialog component
│   │   └── ProtectedRoute.jsx # Route protection
│   ├── pages/               # Page components
│   │   ├── auth/            # Authentication pages
│   │   │   ├── Login.jsx    # Login with MFA
│   │   │   ├── Register.jsx # User registration
│   │   │   └── VerifyEmail.jsx # Email verification
│   │   ├── clients/         # Client management
│   │   │   ├── ClientList.jsx   # Client listing
│   │   │   ├── AddClient.jsx    # Create client
│   │   │   └── EditClient.jsx   # Edit client
│   │   ├── projects/        # Project management
│   │   │   ├── ProjectList.jsx  # Project listing
│   │   │   ├── AddProject.jsx   # Create project
│   │   │   └── EditProject.jsx  # Edit project
│   │   ├── settings/        # User settings
│   │   │   ├── Profile.jsx  # User profile
│   │   │   └── MFASetup.jsx # Two-factor auth setup
│   │   └── Dashboard.jsx    # Main dashboard
│   ├── services/            # API service layer
│   │   ├── authService.js   # Authentication API calls
│   │   ├── clientService.js # Client API calls
│   │   └── projectService.js # Project API calls
│   ├── context/             # React Context providers
│   │   └── AuthContext.jsx  # Authentication state
│   ├── utils/               # Utility functions
│   │   ├── api.js           # Axios configuration
│   │   └── constants.js     # App constants
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles (Tailwind)
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
├── vite.config.js           # Vite configuration
└── .env.example             # Environment template
```

## 🎨 UI Components & Styling

### Tailwind CSS
- Utility-first CSS framework
- Responsive design system
- Custom color palette
- Component-based styling

### Key Components
- **Layout**: Header, Sidebar, Main content area
- **Forms**: Input fields, validation, error handling
- **Tables**: Sortable, searchable data tables
- **Modals**: Confirmation dialogs, forms
- **Navigation**: Role-based menu system

### Icons
- Heroicons for consistent iconography
- Lucide React for additional icons
- Custom SVG icons where needed

## 🔐 Authentication System

### Login Flow
1. Username/password authentication
2. Two-factor authentication (if enabled)
3. JWT token storage
4. Automatic token refresh
5. Role-based route protection

### MFA Setup
- QR code generation for authenticator apps
- TOTP code verification
- Enable/disable functionality
- Backup options

### Protected Routes
```jsx
<ProtectedRoute allowedRoles={['admin', 'editor']}>
  <AddClient />
</ProtectedRoute>
```

## 👥 User Roles & Permissions

### Admin
- Full CRUD access to all resources
- User management capabilities
- System configuration access
- Delete permissions

### Editor
- Create and edit clients/projects
- View all data
- Cannot delete resources
- Limited user management

### Reader
- View-only access to all data
- Cannot create, edit, or delete
- Dashboard and reporting access

## 🏢 Client Management

### Features
- **CRUD Operations**: Create, read, update, delete clients
- **Search & Filter**: Find clients by name, company, case, attorney
- **Comprehensive Data**: Contact info, attorney details, case information
- **Validation**: Real-time form validation with error messages

### Client Form Fields
- Basic Info: Name, company, email, phone
- Address: Street, city, state, zip code
- Attorney: Name, email, phone
- Case Details: Case name, number, date of death
- Notes: Additional information

### Client List Features
- Sortable columns
- Search functionality
- Pagination
- Role-based action buttons
- Responsive design

## 📋 Project Management

### Features
- **Project Types**: Divorce and Estate appraisals
- **Client Association**: Link projects to existing clients
- **User Assignment**: Assign projects to team members
- **Status Tracking**: Pending, In Progress, Completed, Cancelled
- **Date Management**: Start dates, deadlines, completion dates

### Project Form Fields
- Basic Info: Name, type, client selection
- Assignment: User assignment dropdown
- Dates: Start date, deadline, completion date
- Status: Project status selection
- Notes: Additional project information

### Project List Features
- Filter by type, status, assigned user
- Sort by dates, status, client
- Search by project name or client
- Status indicators with colors
- Progress tracking

## 🛠 Services & API Integration

### API Service Structure
```javascript
// authService.js
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  setupMFA: () => api.post('/auth/setup-mfa'),
  verifyMFA: (code) => api.post('/auth/verify-mfa', { code })
};

// clientService.js
export const clientService = {
  getClients: (params) => api.get('/clients/', { params }),
  createClient: (data) => api.post('/clients/', data),
  updateClient: (id, data) => api.put(`/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/clients/${id}`)
};
```

### Error Handling
- Global error interceptors
- User-friendly error messages
- Retry mechanisms
- Loading states

### Request/Response Flow
1. Service function called from component
2. Axios interceptor adds auth headers
3. API request sent to backend
4. Response processed and returned
5. Component updates UI based on response

## 🎯 State Management

### React Context
- AuthContext for user authentication state
- Global state for user info, tokens, permissions
- Automatic token refresh handling

### Local State
- Component-level state for forms
- Loading and error states
- UI interaction states

### Form State Management
- Controlled components
- Real-time validation
- Error message display
- Submit handling

## 📱 Responsive Design

### Breakpoints
- Mobile: 640px and below
- Tablet: 641px - 1024px
- Desktop: 1025px and above

### Mobile Features
- Collapsible sidebar navigation
- Touch-friendly buttons and inputs
- Optimized table layouts
- Responsive form layouts

### Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

## 🧪 Development & Testing

### Development Server
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Quality
- ESLint configuration
- Prettier code formatting
- Component prop validation
- Error boundary implementation

### Testing Setup (Future)
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm run test
```

## 🚀 Production Build

### Build Process
```bash
# Create production build
npm run build

# Preview build locally
npm run preview

# Deploy to static hosting
# Upload dist/ folder to your hosting provider
```

### Optimization Features
- Code splitting
- Tree shaking
- Asset optimization
- Gzip compression
- Cache busting

### Environment Configuration
```env
# Production environment
VITE_API_URL=https://your-api-domain.com
VITE_APP_NAME="Appraisal Report Management"
```

## 🔧 Customization

### Theming
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        }
      }
    }
  }
}
```

### Adding New Pages
1. Create component in `src/pages/`
2. Add route in `App.jsx`
3. Update navigation in `Sidebar.jsx`
4. Add API service if needed
5. Implement role-based access

### Custom Components
1. Create component in `src/components/`
2. Follow existing patterns
3. Add prop validation
4. Include responsive design
5. Document usage

## 📊 Performance Optimization

### Bundle Optimization
- Lazy loading for routes
- Component code splitting
- Dynamic imports
- Tree shaking

### Runtime Performance
- Memoization with React.memo
- useCallback for event handlers
- Debounced search inputs
- Virtualized lists for large datasets

### Caching Strategy
- API response caching
- Browser storage for user preferences
- Service worker for offline support (future)

## 🐛 Troubleshooting

### Common Issues

**API Connection Error**
```bash
# Check backend is running
curl http://localhost:8000/docs

# Verify VITE_API_URL in .env
echo $VITE_API_URL
```

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for dependency conflicts
npm audit
```

**Authentication Issues**
- Check token expiration
- Verify API endpoints
- Clear browser storage
- Check network requests in DevTools

### Development Tips
- Use React DevTools for debugging
- Check browser console for errors
- Use network tab to debug API calls
- Test with different user roles

## 📞 Support

### Debugging Tools
- React Developer Tools
- Browser DevTools
- Network request inspection
- Console logging

### Common Solutions
- **White screen**: Check console for JavaScript errors
- **API errors**: Verify backend is running and accessible
- **Login issues**: Check credentials and MFA setup
- **Permission errors**: Verify user role and route protection

### Performance Monitoring
- Lighthouse audits
- Bundle analyzer
- Runtime performance profiling
- Memory usage monitoring