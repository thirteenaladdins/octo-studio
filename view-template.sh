#!/bin/bash

# Template Viewer Launcher
# Starts a local web server and opens the template viewer

PORT=8000
HOST="localhost"

echo "🎨 Starting Octo Studio Template Viewer..."
echo "=========================================="
echo ""
echo "📂 Serving files from: $(pwd)"
echo "🌐 URL: http://${HOST}:${PORT}/view-template.html"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Starting Python HTTP server on port ${PORT}..."
    echo "   Press Ctrl+C to stop"
    echo ""
    python3 -m http.server ${PORT}
elif command -v php &> /dev/null; then
    echo "✅ Starting PHP server on port ${PORT}..."
    echo "   Press Ctrl+C to stop"
    echo ""
    php -S ${HOST}:${PORT}
else
    echo "❌ Error: Neither python3 nor php found."
    echo "   Please install Python 3 or PHP to run the viewer."
    exit 1
fi
