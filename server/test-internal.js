import { query } from './src/db/pool.js';

async function test() {
  await query("INSERT INTO comments (ticket_id, author_id, body, is_internal) VALUES (1, 1, 'SUPER SECRET INTERNAL MESSAGE: Server password is 1234', 1)");
  console.log('Internal comment injected.');
  process.exit(0);
}
test();
