#!/usr/bin/env node

/**
 * Auto-setup Neon Database (ESM compatible)
 * Usage: npm run db:setup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('\nMissing DATABASE_URL.');
  console.error('Create a .env file in the project root or run this command with DATABASE_URL set.');
  console.error('Example .env line:');
  console.error('DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require\n');
  process.exit(1);
}

async function setupDatabase() {
  let pool;

  try {
    console.log('\n🚀 Auto-Setting up Neon Database...\n');

    // Dynamically import pg (works with ESM)
    const pg = await import('pg');
    const { Pool } = pg;

    console.log('📡 Connecting to Neon...');
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Neon!\n');

    // Read the clean SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'neon_clean_setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📄 Executing database schema (this may take a few seconds)...');

    // Execute the entire SQL (safe with IF NOT EXISTS)
    await pool.query(sql);

    console.log('✅ Schema applied successfully!\n');

    // Verify tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📊 Tables in your database:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Count inventory items
    const countResult = await pool.query('SELECT COUNT(*) as count FROM inventory_items');
    console.log(`\n📦 Inventory items loaded: ${countResult.rows[0].count}`);

    console.log('\n🎉 Database setup complete!\n');
    console.log('Next steps:');
    console.log('  1. Start backend:   node server/index.js');
    console.log('  2. Start frontend:  npm run dev');
    console.log('  3. Open browser:    http://localhost:5173');
    console.log('  4. Login with:      admin@erp.com / admin123\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('Cannot find package') || error.message.includes('pg')) {
      console.error('\n📦 "pg" package is missing.');
      console.error('Please run this first:');
      console.error('   npm install\n');
    } else if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.error('\n🔌 Could not connect to Neon.');
      console.error('Check your internet connection or the DATABASE_URL.');
    }

    console.error('\n📌 Alternative (manual, always works):');
    console.error('  1. Go to https://neon.tech');
    console.error('  2. Open your project → SQL Editor');
    console.error('  3. Copy & paste the content of: database/neon_clean_setup.sql');
    console.error('  4. Click Run\n');

    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

setupDatabase();
