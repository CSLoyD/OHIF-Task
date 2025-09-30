#!/bin/bash

# OHIF Dental Mode Setup Script
# This script sets up the complete OHIF Dental Mode with backend integration

set -e

echo "🦷 OHIF Dental Mode Setup"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_status "Node.js version: $(node -v) ✓"
    
    # Check npm/yarn
    if command -v yarn &> /dev/null; then
        PACKAGE_MANAGER="yarn"
        print_status "Using Yarn: $(yarn -v) ✓"
    elif command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
        print_status "Using npm: $(npm -v) ✓"
    else
        print_error "Neither npm nor yarn is available."
        exit 1
    fi
    
    # Check MongoDB (optional)
    if command -v mongod &> /dev/null; then
        print_status "MongoDB found: $(mongod --version | head -n1) ✓"
        MONGODB_AVAILABLE=true
    else
        print_warning "MongoDB not found. Backend will run without database persistence."
        MONGODB_AVAILABLE=false
    fi
}

# Install frontend dependencies
install_frontend() {
    print_step "Installing frontend dependencies..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn install
    else
        npm install
    fi
    
    print_status "Frontend dependencies installed ✓"
}

# Install backend dependencies
install_backend() {
    print_step "Installing backend dependencies..."
    
    cd backend
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn install
    else
        npm install
    fi
    
    # Create uploads directory
    mkdir -p uploads/audio
    
    # Copy environment file if it doesn't exist
    if [ ! -f .env ]; then
        cp env.example .env
        print_status "Created .env file from template"
        print_warning "Please edit backend/.env with your configuration"
    fi
    
    cd ..
    print_status "Backend dependencies installed ✓"
}

# Start MongoDB if available
start_mongodb() {
    if [ "$MONGODB_AVAILABLE" = true ]; then
        print_step "Starting MongoDB..."
        
        # Check if MongoDB is already running
        if pgrep mongod > /dev/null; then
            print_status "MongoDB is already running ✓"
        else
            # Try to start MongoDB
            if command -v brew &> /dev/null && brew services list | grep mongodb &> /dev/null; then
                brew services start mongodb-community
                print_status "Started MongoDB via Homebrew ✓"
            elif command -v systemctl &> /dev/null; then
                sudo systemctl start mongod
                print_status "Started MongoDB via systemctl ✓"
            else
                print_warning "Please start MongoDB manually: mongod"
            fi
        fi
    fi
}

# Build the project
build_project() {
    print_step "Building the project..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn build:dev
    else
        npm run build:dev
    fi
    
    print_status "Project built successfully ✓"
}

# Create startup scripts
create_scripts() {
    print_step "Creating startup scripts..."
    
    # Create start-dental-mode.sh
    cat > start-dental-mode.sh << 'EOF'
#!/bin/bash

# Start OHIF Dental Mode with Backend
echo "🦷 Starting OHIF Dental Mode..."

# Function to cleanup on exit
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
yarn dev:fast &
FRONTEND_PID=$!

echo "✅ Services started!"
echo "📊 Backend: http://localhost:3001"
echo "🦷 Frontend: http://localhost:3000"
echo "🔗 Dental Mode: http://localhost:3000/dental"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
EOF

    chmod +x start-dental-mode.sh
    
    # Create development script
    cat > start-dental-dev.sh << 'EOF'
#!/bin/bash

# Start OHIF Dental Mode in Development Mode
echo "🦷 Starting OHIF Dental Mode (Development)..."

# Function to cleanup on exit
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in development mode
echo "Starting backend server (development)..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
yarn dev:fast &
FRONTEND_PID=$!

echo "✅ Development services started!"
echo "📊 Backend: http://localhost:3001 (auto-reload)"
echo "🦷 Frontend: http://localhost:3000 (auto-reload)"
echo "🔗 Dental Mode: http://localhost:3000/dental"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
EOF

    chmod +x start-dental-dev.sh
    
    print_status "Startup scripts created ✓"
}

# Create documentation
create_docs() {
    print_step "Creating documentation..."
    
    cat > DENTAL_MODE_SETUP.md << 'EOF'
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
EOF

    print_status "Documentation created ✓"
}

# Main setup function
main() {
    echo "Starting OHIF Dental Mode setup..."
    echo ""
    
    check_prerequisites
    echo ""
    
    install_frontend
    echo ""
    
    install_backend
    echo ""
    
    start_mongodb
    echo ""
    
    create_scripts
    echo ""
    
    create_docs
    echo ""
    
    print_step "Setup completed successfully! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Review and edit backend/.env if needed"
    echo "2. Start the services: ./start-dental-mode.sh"
    echo "3. Access dental mode: http://localhost:3000/dental"
    echo ""
    echo "For development: ./start-dental-dev.sh"
    echo "For documentation: cat DENTAL_MODE_SETUP.md"
    echo ""
    print_status "Happy dental imaging! 🦷"
}

# Run main function
main "$@"
