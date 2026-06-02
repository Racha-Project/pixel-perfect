#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://zzvfjrvcvajncoympjzy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Fi_EZJDg-CSqxsvYu4zxdA_okLzJk5Q';

console.log('🔄 Supabase Migration Runner\n');
console.log('⚠️  NOTE: You need the SERVICE ROLE KEY to run migrations!');
console.log('   The public key cannot be used for DDL operations.\n');

console.log('📋 To complete migrations manually:\n');
console.log('1️⃣  Sign in to Supabase Dashboard:');
console.log('   https://app.supabase.com\n');

console.log('2️⃣  Go to your project (zzvfjrvcvajncoympjzy)\n');

console.log('3️⃣  Open SQL Editor:');
console.log('   https://app.supabase.com/project/zzvfjrvcvajncoympjzy/sql/new\n');

console.log('4️⃣  Copy content from migrations-combined.sql');
const sqlPath = path.join(__dirname, 'migrations-combined.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
console.log(`   📄 File size: ${sqlContent.length} bytes\n`);

console.log('5️⃣  Paste into SQL Editor\n');

console.log('6️⃣  Click "Run" button\n');

console.log('═'.repeat(60));
console.log('✅ After migrations complete:');
console.log('═'.repeat(60));
console.log('1. Check Tables tab to see created tables');
console.log('2. Try creating an account in the app');
console.log('3. Profile will be automatically created in database\n');

// Try to connect and show connection status
try {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });
  
  if (response.ok) {
    console.log('✅ Connection to Supabase successful!');
  } else {
    console.log('⚠️  Supabase connection status:', response.status);
  }
} catch (error) {
  console.log('❌ Could not connect to Supabase:', error.message);
}

console.log('\n📞 Need help? Check MIGRATION_GUIDE.md');
