import { query } from './src/db/pool.js';

async function test() {
  // Post an XSS comment to ticket 1
  await query("INSERT INTO comments (ticket_id, author_id, body, is_internal) VALUES (1, 4, '<img src=x onerror=\"document.body.style.backgroundColor=''red''; alert(''XSS EXECUTED'')\">', 0)");
  console.log('XSS comment injected.');
  process.exit(0);
}
test();
