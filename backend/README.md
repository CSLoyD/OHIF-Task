# OHIF Dental Backend

A Node.js/Express backend server for the OHIF Dental Mode with authentication, viewer state persistence, and dental annotations management.

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (dentist, hygienist, assistant, admin)
- Secure password hashing with bcrypt
- Rate limiting for security
- User profile management

### Viewer State Persistence
- Save and restore viewer configurations
- Auto-save functionality
- Version control for concurrent access
- Session-based state management
- Recent studies tracking

### Dental Annotations
- Text and voice note annotations
- Tooth-specific categorization (FDI/Universal systems)
- Audio file upload and streaming
- Annotation sharing and collaboration
- Search and filtering capabilities
- Statistics and reporting

### Security Features
- Helmet.js for security headers
- CORS configuration
- Input validation and sanitization
- File upload restrictions
- Request rate limiting
- Environment-based configuration

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 4.4+
- npm or yarn

## 🛠️ Installation

1. **Clone and navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/ohif-dental
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Start the server**:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "licenseNumber": "DDS12345"
  },
  "role": "dentist"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer your-access-token
```

### Viewer State Endpoints

#### Save Viewer State
```http
POST /api/viewer-state/save
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "studyInstanceUID": "1.2.3.4.5.6.7.8.9",
  "sessionId": "session-123",
  "state": {
    "viewports": [...],
    "layout": {...},
    "tools": {...},
    "dental": {...}
  },
  "autoSaved": false
}
```

#### Get Viewer State
```http
GET /api/viewer-state?studyInstanceUID=1.2.3.4.5.6.7.8.9&sessionId=session-123
Authorization: Bearer your-access-token
```

#### Auto-save (High Frequency)
```http
POST /api/viewer-state/auto-save
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "studyInstanceUID": "1.2.3.4.5.6.7.8.9",
  "sessionId": "session-123",
  "state": {...}
}
```

### Annotation Endpoints

#### Create Annotation
```http
POST /api/annotations
Authorization: Bearer your-access-token
Content-Type: multipart/form-data

studyInstanceUID: 1.2.3.4.5.6.7.8.9
tooth: {"system": "FDI", "value": "11"}
category: observation
content: {"text": "Crown appears intact"}
priority: normal
audio: [audio file] (optional)
```

#### Get Annotations
```http
GET /api/annotations?studyInstanceUID=1.2.3.4.5.6.7.8.9&toothSystem=FDI&toothValue=11
Authorization: Bearer your-access-token
```

#### Get Annotations by Tooth
```http
GET /api/annotations/tooth/FDI/11?studyInstanceUID=1.2.3.4.5.6.7.8.9
Authorization: Bearer your-access-token
```

#### Get Annotation Statistics
```http
GET /api/annotations/stats/1.2.3.4.5.6.7.8.9
Authorization: Bearer your-access-token
```

## 🗄️ Database Schema

### User Model
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  role: String, // dentist, hygienist, assistant, admin
  profile: {
    firstName: String,
    lastName: String,
    licenseNumber: String,
    practice: {
      name: String,
      address: String,
      phone: String
    }
  },
  preferences: {
    theme: String, // standard, dental
    defaultToothSystem: String, // FDI, Universal
    autoSave: Boolean,
    notifications: {
      email: Boolean,
      browser: Boolean
    }
  },
  isActive: Boolean,
  lastLogin: Date,
  refreshTokens: [{ token: String, createdAt: Date }]
}
```

### ViewerState Model
```javascript
{
  userId: ObjectId,
  studyInstanceUID: String,
  sessionId: String,
  state: {
    viewports: Array,
    layout: Object,
    tools: Object,
    measurements: Array,
    dental: {
      selectedTooth: Object,
      theme: String,
      hangingProtocol: String
    }
  },
  autoSaved: Boolean,
  version: Number
}
```

### Annotation Model
```javascript
{
  userId: ObjectId,
  studyInstanceUID: String,
  tooth: {
    system: String, // FDI, Universal
    value: String
  },
  category: String, // diagnosis, treatment, observation, note
  content: {
    text: String,
    audioData: {
      filename: String,
      mimeType: String,
      size: Number,
      duration: Number,
      url: String
    }
  },
  metadata: Object,
  status: String, // draft, final, reviewed, archived
  priority: String, // low, normal, high, urgent
  tags: [String],
  isPrivate: Boolean,
  sharedWith: [{
    userId: ObjectId,
    permission: String, // read, write
    sharedAt: Date
  }]
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: express-validator for request validation
- **CORS Protection**: Configurable cross-origin requests
- **Helmet.js**: Security headers
- **File Upload Security**: Restricted file types and sizes
- **Environment Variables**: Sensitive data protection

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://your-mongo-host:27017/ohif-dental
JWT_SECRET=your-very-secure-secret-key
CORS_ORIGIN=https://your-frontend-domain.com
```

## 📊 Monitoring & Logging

- **Morgan**: HTTP request logging
- **Health Check**: `/health` endpoint
- **Error Handling**: Centralized error middleware
- **Graceful Shutdown**: SIGTERM/SIGINT handling

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🔧 Development

```bash
# Start in development mode with auto-reload
npm run dev

# Check health
curl http://localhost:3001/health
```

## 📝 API Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": {...},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Validation Error Response
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

## 🤝 Integration with OHIF Frontend

The backend integrates seamlessly with the OHIF Dental Mode frontend:

1. **Authentication**: JWT tokens for secure API access
2. **State Persistence**: Auto-save viewer configurations
3. **Annotations**: Real-time dental annotations with voice notes
4. **File Management**: Audio file upload and streaming

## 📈 Performance Considerations

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: MongoDB connection optimization
- **Compression**: gzip compression for responses
- **Caching**: In-memory caching for frequently accessed data
- **File Streaming**: Efficient audio file serving

## 🛠️ Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**:
   - Check MongoDB is running
   - Verify connection string in `.env`
   - Check network connectivity

2. **JWT Token Errors**:
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper Authorization header format

3. **File Upload Issues**:
   - Check upload directory permissions
   - Verify file size limits
   - Ensure supported file types

4. **CORS Errors**:
   - Update CORS_ORIGIN in `.env`
   - Check frontend URL configuration

## 📞 Support

For issues and questions:
- Check the logs for detailed error messages
- Verify environment configuration
- Review API documentation
- Check database connectivity

## 🔄 Version History

- **v1.0.0**: Initial release with authentication, state persistence, and annotations
- Features: JWT auth, MongoDB integration, file uploads, dental-specific APIs
