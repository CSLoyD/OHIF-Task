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
