#!/bin/bash

echo "HR Management System Password Reset Tool"
echo "========================================"
echo "This script will reset all passwords in the database to 'StrongP@ss123'"
echo "Using a simple SHA-256 hash algorithm for compatibility"
echo

# Option 1: SQL method
if command -v psql &> /dev/null; then
  echo "Found PostgreSQL client, using SQL method..."
  
  # Get database details
  read -p "Database host [localhost]: " DB_HOST
  DB_HOST=${DB_HOST:-localhost}
  
  read -p "Database port [5432]: " DB_PORT
  DB_PORT=${DB_PORT:-5432}
  
  read -p "Database name [hr_management]: " DB_NAME
  DB_NAME=${DB_NAME:-hr_management}
  
  read -p "Database user [postgres]: " DB_USER
  DB_USER=${DB_USER:-postgres}
  
  # The SHA-256 hash of 'hr-management-fixed-salt' + 'StrongP@ss123'
  HASHED_PASSWORD="2b618da7a6c1a8ccdf66f1f46ef41ee88f492a4cd97c90f9b5a24c30b6e47f18"
  
  echo
  echo "Running SQL update..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
    UPDATE employee SET password = '$HASHED_PASSWORD';
    SELECT COUNT(*) AS updated_users FROM employee;
EOF

  if [ $? -eq 0 ]; then
    echo "Password reset successful!"
  else
    echo "Password reset failed."
  fi

# Option 2: Node.js method
elif command -v node &> /dev/null; then
  echo "Found Node.js, using JavaScript method..."
  
  # Check if pg module is installed
  if ! node -e "require('pg')" &> /dev/null; then
    echo "Installing pg module..."
    npm install pg --no-save
  fi
  
  # Run the Node.js script
  node reset-passwords.js
  
  if [ $? -eq 0 ]; then
    echo "Password reset successful!"
  else
    echo "Password reset failed."
  fi

else
  echo "Error: Neither PostgreSQL client nor Node.js found."
  echo "Please install one of these tools to run the password reset."
  exit 1
fi

echo
echo "All users can now log in with the password: StrongP@ss123"
echo "Please restart your application server for the new password hashing to take effect."