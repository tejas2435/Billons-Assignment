# Part 2 Decision Notes: SLA Breach Tracking

When implementing the SLA breach tracking feature, the provided specification left several edge cases and technical implementation details open. Below are the decisions I made, the reasoning behind them, and how my findings in Part 1 influenced the architecture.

## 1. What constitutes a "Response"?
**Decision:** A ticket is considered "responded to" when a user with the role of `agent` or `admin` leaves a comment on the ticket. 
**Reasoning:** The specification did not define how a response is tracked. While status changes (e.g., changing from `open` to `pending`) usually imply a response, the current database schema (`tickets` table) only stores the current status and `updated_at`. It does not maintain a historical audit log of exactly *when* the status changed. Relying on status would mean we couldn't accurately retroactively calculate SLA breaches. However, the `comments` table permanently stores the `created_at` timestamp of every interaction. By checking for the first comment authored by an agent/admin, we get an immutable, historically accurate timestamp for the first response.

## 2. Does a ticket remain breached after a late response?
**Decision:** Yes. If a ticket was replied to *after* the SLA target elapsed, it remains permanently marked as "Breached". 
**Reasoning:** In helpdesk environments, SLA reporting is used to measure support performance. If an agent replies to a P1 ticket (4-hour target) after 6 hours, the SLA was objectively failed. If the badge disappeared the moment they replied, management would lose visibility into historical SLA failures. Therefore, the breach logic calculates: `MIN(agent_comment_created_at) > (ticket_created_at + sla_target)`.

## 3. How Part 1 influenced the Part 2 architecture
**Decision:** I implemented the entire breach calculation at the SQL layer using `COALESCE` and subqueries, rather than doing date math in Node.js.
**Reasoning:** During the Part 1 codebase review, I discovered a severe N+1 query performance issue in `ticketService.js` (a loop running a `COUNT` query for every ticket on the page). If I had fetched the SLA response timestamps inside a similar loop in JavaScript, I would have severely worsened the N+1 performance bottleneck. 

Instead, I embedded the SLA calculation directly into the main `SELECT` statement:
```sql
(
  COALESCE(
    (SELECT MIN(c.created_at) FROM comments c JOIN users a ON c.author_id = a.id WHERE c.ticket_id = t.id AND a.role IN ('agent', 'admin')),
    NOW()
  ) > DATE_ADD(t.created_at, INTERVAL CASE t.priority WHEN 'P1' THEN 4 WHEN 'P2' THEN 24 ELSE 72 END HOUR)
) AS is_breached
```
This single decision accomplished three things simultaneously:
1. It computed the SLA without adding any N+1 overhead.
2. It allowed the "Breached only" UI filter to be applied directly in the SQL `WHERE` clause without fetching and filtering arrays in memory.
3. It allowed me to cleanly fix the Part 1 N+1 bug at the exact same time by embedding the comment counts in the same pass.
