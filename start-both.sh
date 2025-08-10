#!/bin/bash

echo "🚀 Starting Both Backend and Frontend Servers..."

# Get the directory where this script is located
SCRIPT_DIR="$(dirname "$0")"

echo "🔧 Starting Backend Server..."
bash "$SCRIPT_DIR/start-backend.sh"

if [ $? -ne 0 ]; then
    echo "❌ Failed to start backend server"
    exit 1
fi

echo ""
echo "🔧 Starting Frontend Server..."
bash "$SCRIPT_DIR/start-frontend.sh"

if [ $? -ne 0 ]; then
    echo "❌ Failed to start frontend server"
    exit 1
fi

echo ""
echo "🎉 Both servers are now running!"
echo "🌐 Backend: http://localhost:3000"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "💡 To stop both servers:"
echo "   killall node"
echo "   Or press Ctrl+C in each terminal"
