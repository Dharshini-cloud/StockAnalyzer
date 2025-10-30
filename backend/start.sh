#!/bin/bash
echo "Starting Stock Analyzer Backend..."
echo "Environment: $RENDER"

# Check if we're on Render (Linux) or local (Windows)
if [ "$RENDER" = "true" ]; then
    echo "Running on Render - using Gunicorn..."
    gunicorn --bind 0.0.0.0:5000 --worker-class eventlet -w 1 wsgi:app
else
    echo "Running locally - using Python server..."
    python wsgi.py
fi