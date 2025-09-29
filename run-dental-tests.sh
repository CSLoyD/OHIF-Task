#!/bin/bash

# Dental Extension Test Runner
# This script runs the unit tests for the dental extension

echo "🦷 OHIF Dental Extension Test Runner"
echo "===================================="

# Navigate to dental extension directory
cd extensions/dental

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
fi

echo ""
echo "🧪 Running dental extension tests..."
echo ""

# Run tests with coverage
yarn test:coverage

echo ""
echo "✅ Test run complete!"
echo ""
echo "📊 Coverage report generated in extensions/dental/coverage/"
echo "🔍 Open extensions/dental/coverage/lcov-report/index.html to view detailed coverage"
