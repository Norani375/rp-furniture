#!/usr/bin/env node

import 'dotenv/config';
import pkg from 'pg';

const { Client } = pkg;

const rawUrl = process.env.DATABASE_URL;

function maskUrl(url) {
  if (!url) return '(missing)';
  return url.replace(/:(.*?)@/, ':********@');
}

async function main() {
  console.log('\n🔎 ERP Database Connection Check\n');

  if (!rawUrl) {
    console.error('❌ DATABASE_URL در فایل .env تنظیم نشده است.');
    console.error('\nنمونه درست:');
    console.error('DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@HOST/neondb?sslmode=require');
    process.exit(1);
  }

  console.log('📌 DATABASE_URL (masked):');
  console.log(maskUrl(rawUrl));

  const checks = {
    hasPostgresPrefix: rawUrl.startsWith('postgresql://') || rawUrl.startsWith('postgres://'),
    hasSslMode: rawUrl.includes('sslmode='),
    hasNeonHost: rawUrl.includes('neon.tech'),
    hasPooler: rawUrl.includes('-pooler.'),
    hasDbName: /\/[^/?]+(\?|$)/.test(rawUrl),
  };

  console.log('\n🧪 Static checks:');
  console.log(`- Prefix postgres:// or postgresql:// : ${checks.hasPostgresPrefix ? '✅' : '❌'}`);
  console.log(`- Contains sslmode                    : ${checks.hasSslMode ? '✅' : '❌'}`);
  console.log(`- Neon host detected                  : ${checks.hasNeonHost ? '✅' : '❌'}`);
  console.log(`- Neon pooler detected                : ${checks.hasPooler ? '✅' : '⚠️'}`);
  console.log(`- Database name present               : ${checks.hasDbName ? '✅' : '❌'}`);

  const client = new Client({
    connectionString: rawUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('\n⏳ Trying to connect...');
    await client.connect();

    const version = await client.query('select version()');
    const now = await client.query('select now() as now');

    console.log('✅ اتصال به دیتابیس موفق شد.');
    console.log(`🕒 Server time: ${now.rows[0].now}`);
    console.log(`🐘 PostgreSQL: ${version.rows[0].version.split(',')[0]}`);

    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
      LIMIT 20
    `);

    console.log(`📦 Public tables found: ${tables.rowCount}`);
    if (tables.rowCount > 0) {
      console.log('Tables:');
      for (const row of tables.rows) {
        console.log(`  - ${row.table_name}`);
      }
    }

    console.log('\n✅ حالا می‌توانید این دستورها را اجرا کنید:');
    console.log('1) node server/index.js');
    console.log('2) npm run dev\n');
  } catch (error) {
    console.error('❌ اتصال ناموفق بود.');
    console.error(`Message: ${error.message}`);

    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 مشکل: رمز عبور Neon اشتباه است.');
      console.error('راه‌حل:');
      console.error('1) وارد neon.tech شوید');
      console.error('2) Project → Roles → neondb_owner → Reset password');
      console.error('3) رمز جدید را در فایل .env جایگزین کنید');
    } else if (error.message.includes('does not support SSL')) {
      console.error('\n💡 مشکل: سرور مقصد Neon نیست یا URL اشتباه است.');
      console.error('لطفاً connection string را دوباره از Neon Dashboard کپی کنید.');
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('\n💡 مشکل: آدرس هاست پیدا نشد.');
      console.error('شبکه/اینترنت یا host در DATABASE_URL را بررسی کنید.');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 مشکل: اتصال timeout شد.');
      console.error('اینترنت، firewall یا تنظیمات شبکه را بررسی کنید.');
    }

    console.error('\n📌 URL فعلی (masked):');
    console.error(maskUrl(rawUrl));
    process.exitCode = 1;
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

main();
