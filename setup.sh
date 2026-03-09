#!/bin/bash
# Personal Finance App - Setup Script

echo "=== Personal Finance App Setup ==="
echo ""

# Check for PostgreSQL
if command -v psql &> /dev/null; then
    echo "[OK] PostgreSQL found"
    echo "Creating database 'finance_app'..."
    psql -U postgres -c "CREATE DATABASE finance_app;" 2>/dev/null || echo "Database may already exist"
else
    echo "[!] PostgreSQL not found. Please install PostgreSQL and create a database called 'finance_app'"
fi

echo ""
echo "=== Installing Backend Dependencies ==="
cd backend
npm install
cd ..

echo ""
echo "=== Installing Frontend Dependencies ==="
cd frontend
npm install
cd ..

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start the application:"
echo "  1. Make sure PostgreSQL is running with database 'finance_app'"
echo "  2. Update backend/.env with your database credentials"
echo "  3. Terminal 1: cd backend && npm run dev"
echo "  4. Terminal 2: cd frontend && npm run dev"
echo "  5. Open http://localhost:3000"
