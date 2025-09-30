# 🦷 OHIF Dental Mode - Complete Setup Guide

## Quick Start

### 1. Start All Services
```bash
./start-dental-mode.sh
```

### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Dental Mode**: http://localhost:3000/dental
- **Health Check**: http://localhost:3001/health

### 3. Development Mode
```bash
./start-dental-dev.sh
```

## Features

### 🎨 Enhanced Dental UI
- Custom dental theme with cyan accent colors
- Practice header with patient information
- Tooth selector (FDI/Universal systems)
- 2x2 hanging protocol for dental imaging

### 📝 Dental Annotations
- Text and voice note annotations
- Tooth-specific categorization
- Audio recording and playback
- Export functionality
- Real-time synchronization with backend

### 💾 State Persistence
- Auto-save viewer configurations
- Session management
- Recent studies tracking
- Cross-device synchronization

### 🔐 Authentication
- JWT-based secure authentication
- Role-based access control
- User profile management
- Session management

## Usage

### First Time Setup
1. Register a new account at http://localhost:3000/dental
2. Choose your role (dentist, hygienist, assistant)
3. Set up your practice information
4. Load DICOM studies and start using dental mode

### Loading Studies
1. **From Worklist**: Navigate to http://localhost:3000 and upload DICOM files
2. **Direct URL**: http://localhost:3000/dental?StudyInstanceUIDs=your-study-uid
3. **Local Files**: Drag and drop DICOM files at http://localhost:3000/local

### Using Dental Features
1. **Activate Dental Theme**: Click the 🦷 toggle in the header
2. **Select Tooth**: Use the tooth selector dropdown
3. **Make Measurements**: Use the dental measurements palette
4. **Add Annotations**: Use the annotations panel for voice notes
5. **Export Data**: Export measurements and annotations as JSON

## Configuration

### Backend Configuration
Edit `backend/.env`:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/ohif-dental
JWT_SECRET=your-secure-secret
CORS_ORIGIN=http://localhost:3000
```

### Frontend Configuration
The frontend automatically connects to the backend at `http://localhost:3001`.

## Troubleshooting

### Common Issues

1. **Backend won't start**:
   - Check if port 3001 is available
   - Verify MongoDB is running (if using database)
   - Check backend/.env configuration

2. **Frontend won't connect to backend**:
   - Verify backend is running on port 3001
   - Check CORS configuration
   - Verify API endpoints are accessible

3. **Authentication issues**:
   - Clear browser localStorage
   - Check JWT_SECRET in backend/.env
   - Verify user registration/login

4. **File upload issues**:
   - Check backend/uploads directory permissions
   - Verify file size limits
   - Check supported audio formats

### Debug Mode
Enable debug logging:
```javascript
// In browser console
localStorage.setItem('debug', 'ohif:*');
// Refresh the page
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout user

### Viewer State
- `POST /api/viewer-state/save` - Save viewer state
- `GET /api/viewer-state` - Get viewer state
- `POST /api/viewer-state/auto-save` - Auto-save state

### Annotations
- `POST /api/annotations` - Create annotation
- `GET /api/annotations` - Get annotations
- `GET /api/annotations/tooth/:system/:value` - Get tooth annotations
- `PUT /api/annotations/:id` - Update annotation
- `DELETE /api/annotations/:id` - Delete annotation

## Development

### Project Structure
```
/
├── extensions/dental/          # Dental extension
├── modes/dental/              # Dental mode
├── backend/                   # Backend server
├── platform/app/src/App.css   # Enhanced dental styling
└── setup scripts              # Startup scripts
```

### Adding New Features
1. Frontend components: `extensions/dental/src/components/`
2. Backend routes: `backend/routes/`
3. Database models: `backend/models/`
4. Services: `extensions/dental/src/services/`

### Testing
```bash
# Frontend tests
yarn test

# Backend tests
cd backend && npm test

# E2E tests
yarn test:e2e
```

## Support

For issues and questions:
- Check the console for error messages
- Verify all services are running
- Review the API documentation
- Check database connectivity (if using MongoDB)

## Version Information
- OHIF Viewer: v3.12.0+
- Node.js: 18+
- MongoDB: 4.4+ (optional)
- Dental Extension: v1.0.0
