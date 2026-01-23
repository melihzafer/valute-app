// init-db.js - One-time script to create database tables
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Get the database path (same as the app uses)
const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'valute-app');
const dbPath = path.join(userDataPath, 'data', 'valute.db');

console.log('📂 Database location:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found. Please start the app first to create it.');
  process.exit(1);
}

// Read the migration SQL
const migrationSQL = fs.readFileSync('./src/main/db/migrations/0000_clammy_marvel_boy.sql', 'utf8');

// Open database and create tables
console.log('🔧 Opening database...');
const db = new Database(dbPath);

console.log('📝 Creating tables...');
db.exec(migrationSQL);

console.log('✅ Database tables created successfully!');
console.log('');
console.log('Tables created:');
console.log('  ✓ projects');
console.log('  ✓ logs');
console.log('  ✓ expenses');
console.log('  ✓ invoices');
console.log('  ✓ services');
console.log('  ✓ settings');
console.log('');
console.log('🚀 You can now restart the app and create projects!');

db.close();
