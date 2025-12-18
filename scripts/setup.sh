#!/bin/bash

echo "🚀 Setup 3Blex Network..."

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p server/uploads

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration!"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Create PostgreSQL database: createdb 3blex_network"
echo "3. Run schema: psql -d 3blex_network -f server/db/schema.sql"
echo "4. Start frontend: npm run dev"
echo "5. Start backend: npm run server"

