#!/bin/bash

# Development server startup script for RobinsonLimitMP
# This script starts the development server with environment variable support

echo "🚀 Starting RobinsonLimitMP Development Server"
echo "=============================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found!"
    echo "   Creating one from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "   ✅ Created .env file from .env.example"
        echo "   📝 Please edit .env file with your API keys"
    else
        echo "   ❌ No .env.example file found either"
        echo "   📝 Please create a .env file manually"
    fi
    echo ""
fi

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "🐍 Using Python 3 development server"
    python3 dev-server.py "$@"
elif command -v python &> /dev/null; then
    echo "🐍 Using Python development server"
    python dev-server.py "$@"
else
    echo "❌ Python not found!"
    echo "   Please install Python 3 to use the development server"
    echo ""
    echo "Alternative: Use a different server and set environment variables manually:"
    echo "   export OPENWEATHER_API_KEY=your_key_here"
    echo "   export WEATHERAPI_KEY=your_key_here"
    echo "   python3 -m http.server 8000"
    exit 1
fi 