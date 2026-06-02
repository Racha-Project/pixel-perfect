#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://zzvfjrvcvajncoympjzy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Fi_EZJDg-CSqxsvYu4zxdA_okLzJk5Q';

// Read all migration files
const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Found ${migrationFiles.length} migration files:\n`);
migrationFiles.forEach(f => console.log(`  - ${f}`));

console.log('\n⚠️  To run migrations, you need to:');
console.log('\n1. Go to Supabase Dashboard: https://app.supabase.com');
console.log('2. Select project: zzvfjrvcvajncoympjzy');
console.log('3. Go to SQL Editor');
console.log('4. Click "New query"');
console.log('\n5. Copy and paste the SQL from these files in order:');

migrationFiles.forEach((file, idx) => {
  const sqlPath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`📄 Migration ${idx + 1}/${migrationFiles.length}: ${file}`);
  console.log(`${'='.repeat(80)}\n`);
  console.log(sql.substring(0, 200) + (sql.length > 200 ? '...' : ''));
});

console.log('\n\n' + '='.repeat(80));
console.log('✅ After pasting each migration, click "Run" button');
console.log('='.repeat(80));
