-- This script resets all passwords to the SHA-256 hash of StrongP@ss123
-- HR management system password fixer
-- Run with: psql -h localhost -U postgres -d hr_management -f reset-passwords.sql

-- The hash is a SHA-256 hash of the fixed salt + password:
-- 'hr-management-fixed-salt' + 'StrongP@ss123'
UPDATE employee SET 
  password = '2b618da7a6c1a8ccdf66f1f46ef41ee88f492a4cd97c90f9b5a24c30b6e47f18';

-- Display updated count
SELECT 'All passwords have been reset to StrongP@ss123 using the new hashing algorithm' AS message;
SELECT COUNT(*) AS updated_users FROM employee;