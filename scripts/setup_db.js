#!/usr/bin/env node

/**
 * Auto-setup Neon Database (ESM version)
 * Usage: node scripts/setup_db.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_3BDYyoPGWh6g@ep-plain-fire-aqjgfoax-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function setupDatabase() {
  let pool;

  try {
    console.log('\n🚀 Auto-Setting up Neon Database...\n');

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

    console.log('📄 Executing database schema...');

    // Execute the entire SQL file (Neon supports multi-statement)
    await pool.query(sql);

    console.log('✅ Schema executed successfully!\n');

    // Verify tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📊 Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Count inventory
    const countResult = await pool.query('SELECT COUNT(*) as count FROM inventory_items');
    console.log(`\n📦 Inventory items loaded: ${countResult.rows[0].count}`);

    console.log('\n🎉 Database setup complete!\n');
    console.log('Next steps:');
    console.log('  1. Start backend:  node server/index.js');
    console.log('  2. Start frontend: npm run dev');
    console.log('  3. Open:           http://localhost:5173');
    console.log('  4. Login:          admin@erp.com / admin123\n');

  } catch (error) {
    console.error('\n❌ Error during setup:');
    console.error(error.message);

    if (error.message.includes('connect')) {
      console.error('\n💡 Check your DATABASE_URL in .env or the default connection string.');
    }

    console.error('\nAlternative (manual):');
    console.error('  1. Go to https://neon.tech');
    console.error('  2. Open SQL Editor');
    console.error('  3. Paste content of: database/neon_clean_setup.sql');
    console.error('  4. Click Run\n');

    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

setupDatabase();
