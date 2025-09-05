#!/bin/bash
set -e

echo "🚀 Starting Render build process..."

echo "🔍 Node.js version:"
node --version

echo "🔍 NPM version:"
npm --version

echo "📦 Installing ALL dependencies (including dev dependencies for build)..."
npm install --include=dev

echo "🔍 Verifying Vite installation:"
npx vite --version

echo "🔍 Verifying Esbuild installation:"  
npx esbuild --version

echo "🏗️ Building frontend with Vite..."
npx vite build

echo "🏗️ Building server with Esbuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"
echo "📁 Contents of dist directory:"
ls -la dist/
