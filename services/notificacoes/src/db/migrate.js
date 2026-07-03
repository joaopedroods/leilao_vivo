const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  let sql = fs.readFileSync(schemaPath, 'utf8');
  sql = sql.replace(/^\uFEFF/, '');

  try {
    await pool.query(sql);
    console.log('[migrate] schema aplicado com sucesso.');
  } catch (err) {
    console.error('[migrate] falhou ao aplicar schema:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
