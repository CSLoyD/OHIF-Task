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
