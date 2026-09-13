import { query } from './src/db/pool.js';

async function test() {
  // 1. Hit the invite/accept API
  await fetch('http://localhost:4000/api/auth/invite/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 5, password: 'HackedPassword123' })
  });

  // 2. Read the DB
  const rows = await query('SELECT email, password_hash FROM users WHERE id = 5');
  console.log('Database Record for User 5:');
  console.log(rows[0]);
  process.exit(0);
}
test();
