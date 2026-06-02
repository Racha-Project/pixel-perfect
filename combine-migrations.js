#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

let combined = `-- Combined Migrations for Fitder X
-- Generated: ${new Date().toISOString()}
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/zzvfjrvcvajncoympjzy/sql/new

`;

files.forEach(file => {
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
  combined += `\n-- ========== ${file} ==========\n`;
  combined += sql + '\n';
});

fs.writeFileSync(path.join(__dirname, 'migrations-combined.sql'), combined);
console.log('✅ Created migrations-combined.sql');
console.log('📊 File size:', fs.statSync(path.join(__dirname, 'migrations-combined.sql')).size, 'bytes');
console.log('\n📋 Instructions:');
console.log('1. Open: https://app.supabase.com/project/zzvfjrvcvajncoympjzy/sql/new');
console.log('2. Copy all content from migrations-combined.sql');
console.log('3. Paste into the SQL editor');
console.log('4. Click "Run" button\n');
