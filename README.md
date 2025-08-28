# Appraisal Report Frontend

React + Vite frontend for the Appraisal Report Management System with template management and report generation.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if needed (default should work)

# Start development server
npm run dev
```

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.jsx      # Main layout with navigation
│   ├── ProjectReports.jsx  # Report generation
│   └── ProtectedRoute.jsx  # Route protection
├── pages/              # Page components
│   ├── auth/          # Login, signup, verification
│   ├── clients/       # Client management
│   ├── projects/      # Project management
│   └── templates/     # Template management
│       ├── TemplateList.jsx
│       ├── TemplateUpload.jsx
│       ├── TemplateDetails.jsx
│       ├── FieldMappingEditor.jsx
│       └── ReportGenerator.jsx
├── services/          # API services
│   ├── authService.js
│   ├── clientService.js
│   ├── projectService.js
│   └── templateService.js
├── context/           # React context
│   ├── AuthContext.jsx
│   └── ToastContext.jsx
└── utils/             # Utilities
```

## 🔧 Features

### Template Management
- **Upload**: Drag-and-drop Word template upload
- **Field Mapping**: Visual field configuration editor
- **Preview**: Template preview with field mappings
- **Download**: Original, fillable, and populated templates

### Project-Centric Reports
- **Generate from Projects**: Create reports directly from project details
- **Template Selection**: Choose compatible templates by appraisal type
- **Auto-Download**: Generated reports download automatically
- **Real Data**: Reports populated with actual project/client data

### User Interface
- **Responsive Design**: Works on desktop and tablet
- **Role-Based UI**: Different interfaces for Admin/Editor/Reader
- **Real-time Validation**: Form validation with immediate feedback
- **Toast Notifications**: User-friendly success/error messages

### Navigation & Security
- **Protected Routes**: Role-based route protection
- **JWT Authentication**: Secure API communication
- **Auto-logout**: Automatic logout on token expiration
- **Permission Checks**: UI elements based on user permissions

## 🎨 Components

### Template Components
- **TemplateList**: Browse and filter templates
- **TemplateUpload**: Upload new templates with validation
- **TemplateDetails**: View template info and field mappings
- **FieldMappingEditor**: Configure field types and defaults
- **ProjectReports**: Generate reports from project page

### Shared Components
- **Layout**: Main application layout with sidebar
- **ProtectedRoute**: Route protection with role checking
- **Toast**: Notification system for user feedback

## 🔒 Security

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Secure logout with token cleanup
- Role-based access control

### File Handling
- Client-side file validation
- Secure file upload with progress
- Blob handling for downloads
- Proper file cleanup

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 640px and below
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px and above

### Features
- Responsive navigation
- Mobile-friendly forms
- Touch-friendly buttons
- Optimized layouts

## 🌐 API Integration

### Services
```javascript
// Template operations
templateService.getTemplates(type, active)
templateService.uploadTemplate(file, type, description)
templateService.generateReport(templateId, projectId, type)

// Project operations
projectService.getProjects()
projectService.getProject(id)

// Client operations
clientService.getClients()
```

### Error Handling
- Network error recovery
- User-friendly error messages
- Automatic retry for failed requests
- Graceful degradation

## 🎯 User Workflows

### Template Management
1. **Upload**: Templates → Upload → Configure Fields → Save
2. **Generate**: Projects → Select Project → Choose Template → Generate

### Report Generation
1. **Project-First**: Projects → View Details → Generate Reports
2. **Template-First**: Templates → Select → Generate → Choose Project

## 🔧 Configuration

### Environment Variables
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME="Appraisal Report Management"
```

### Build & Deploy
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy static files
npm run build && cp -r dist/* /var/www/html/
```