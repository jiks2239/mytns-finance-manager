#!/bin/bash

echo "🚀 Starting Frontend Server Management Script..."

# Navigate to frontend directory
cd "$(dirname "$0")/frontend" || {
    echo "❌ Error: Could not navigate to frontend directory"
    exit 1
}

echo "📁 Current directory: $(pwd)"

# Check if frontend server is already running on port 5173 (Vite default)
echo "🔍 Checking if frontend server is already running on port 5173..."
if lsof -i :5173 >/dev/null 2>&1; then
    echo "⚠️  Frontend server is already running on port 5173"
    echo "🛑 Stopping existing frontend server..."
    
    # Get the PID and kill it
    PID=$(lsof -ti :5173)
    if [ ! -z "$PID" ]; then
        kill -9 $PID
        echo "✅ Killed process $PID"
        sleep 2
    fi
else
    echo "✅ Port 5173 is available"
fi

# Verify we have package.json
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in $(pwd)"
    echo "❌ Make sure you're running this script from the project root directory"
    exit 1
fi

echo "🔧 Starting frontend server..."
echo "📍 Running: npm run dev"

# Start the frontend server
npm run dev &

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if lsof -i :5173 >/dev/null 2>&1; then
    echo "✅ Frontend server started successfully on http://localhost:5173"
else
    echo "❌ Failed to start frontend server"
    exit 1
fi

echo "🎉 Frontend server is now running!"
echo "💡 To stop the server, press Ctrl+C or run: killall node"
