const crypto = require('crypto');
const { Client } = require('pg');

async function resetPasswords() {
  // Create a PostgreSQL client
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'hr_management',
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Generate the hash
    const fixedSalt = 'hr-management-fixed-salt';
    const defaultPassword = 'StrongP@ss123';
    const hash = crypto
      .createHash('sha256')
      .update(fixedSalt + defaultPassword)
      .digest('hex');

    console.log(`Generated hash for default password: ${hash}`);

    // Update all employee passwords
    const result = await client.query(
      `UPDATE employee SET password = $1 RETURNING id`,
      [hash]
    );

    console.log(`Updated ${result.rowCount} employee passwords to use the new hash algorithm`);
    console.log(`Default password for all accounts: StrongP@ss123`);

  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    // Close the connection
    await client.end();
    console.log('Disconnected from PostgreSQL database');
  }
}

// Run the function
resetPasswords();