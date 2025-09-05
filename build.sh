#!/bin/bash
set -e

echo "🔍 Node.js version:"
node --version

echo "🔍 NPM version:"
npm --version

echo "📦 Installing dependencies with npm ci..."
npm ci

echo "🔍 Checking if vite is installed:"
npx vite --version

echo "🏗️ Building application..."
npm run build

echo "✅ Build completed successfully!"
