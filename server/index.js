async function initDB() {
  try {
    console.log(
      "DATABASE_URL:",
      process.env.DATABASE_URL ? "Loaded ✅" : "Missing ❌"
    );

    const pg = await import('pg');
    const { Pool } = pg.default || pg;

    const connStr = process.env.DATABASE_URL || '';

    if (!connStr) {
      console.log('⚠️ No DATABASE_URL — running in memory mode');
      return;
    }

    db = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });

    await db.query('SELECT NOW()');

    dbConnected = true;
    console.log('✅ Connected to Neon PostgreSQL');
  } catch (err) {
    console.error('❌ Neon Error:', err.message);
  }
}
