#!/bin/bash
echo "🧹 Cleaning up database and Prisma client..."

# Remove old generated client
rm -rf generated/

# Generate fresh Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Apply all migrations
echo "🔄 Applying migrations..."
npx prisma migrate deploy

echo "✅ Done! Restart your server with: npm run dev"
