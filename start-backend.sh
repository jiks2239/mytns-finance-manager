#!/bin/bash

echo "🚀 Starting Backend Server Management Script..."

# Navigate to backend directory
cd "$(dirname "$0")/backend" || {
    echo "❌ Error: Could not navigate to backend directory"
    exit 1
}

echo "📁 Current directory: $(pwd)"

# Check if backend server is already running on port 3000
echo "🔍 Checking if backend server is already running on port 3000..."
if lsof -i :3000 >/dev/null 2>&1; then
    echo "⚠️  Backend server is already running on port 3000"
    echo "🛑 Stopping existing backend server..."
    
    # Get the PID and kill it
    PID=$(lsof -ti :3000)
    if [ ! -z "$PID" ]; then
        kill -9 $PID
        echo "✅ Killed process $PID"
        sleep 2
    fi
else
    echo "✅ Port 3000 is available"
fi

# Verify we have package.json
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in $(pwd)"
    echo "❌ Make sure you're running this script from the project root directory"
    exit 1
fi

echo "🔧 Starting backend server..."
echo "📍 Running: npm run start:dev"

# Start the backend server
npm run start:dev &

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if lsof -i :3000 >/dev/null 2>&1; then
    echo "✅ Backend server started successfully on http://localhost:3000"
else
    echo "❌ Failed to start backend server"
    exit 1
fi

echo "🎉 Backend server is now running!"
echo "💡 To stop the server, press Ctrl+C or run: killall node"
