# Codebase Review

**Ranked Summary of Findings**
1. XSS vulnerability in ticket comments (Critical)
2. Users can read other companies' tickets (Critical)
3. Missing role checks on assign and delete (High)
4. Missing UI to create new tickets (High)
5. SQL injection in ticket list sorting (High)
6. Customers can see internal comments (Medium)
7. Pagination bug hides the newest tickets (Medium)
8. N+1 query performance issue on ticket list (Low)

---

## 1. XSS vulnerability in ticket comments
* **Where:** `client/src/features/tickets/TicketDetail.jsx`, Line 65
* **What is wrong:** The frontend uses `dangerouslySetInnerHTML` to display comments, which renders raw HTML instead of plain text.
* **Why it matters here:** A malicious comment containing HTML or JavaScript may execute in another user's browser when the ticket is viewed. This could allow unauthorized actions as the victim or expose sensitive information accessible to that session.
* **How you would fix it:** Since the application uses a plain textarea and does not intentionally support formatted HTML, remove `dangerouslySetInnerHTML` and render the comment using standard text interpolation: `<div style={{ whiteSpace: 'pre-wrap' }}>{c.body}</div>`.
* **Severity:** Critical

## 2. Users can read other companies' tickets
* **Where:** `server/src/routes/tickets.js`, Lines 31, 62, 75
* **What is wrong:** The API routes for reading, assigning, and deleting tickets don't check if the ticket belongs to the user's organization.
* **Why it matters here:** Someone from Cobalt Logistics can just change the ID in the URL to view or delete support tickets that belong to Northwind Trading.
* **How you would fix it:** Add a simple check: `if (ticket.org_id !== req.user.orgId) return res.status(404).json({ error: 'Not found' });`.
* **Severity:** Critical

## 3. Missing role checks on assign and delete
* **Where:** `server/src/routes/tickets.js`, Lines 62, 75
* *(Note: This covers both assigning and deleting since they share the same issue).*
* **What is wrong:** The API checks if a user is logged in, but doesn't check their specific role for assigning or deleting tickets.
* **Why it matters here:** A normal requester can bypass the UI and use the API to claim a ticket (which only agents should do) or delete it (which only admins should do).
* **How you would fix it:** Add the `requireRole('agent', 'admin')` middleware to the assign route, and `requireRole('admin')` to the delete route.
* **Severity:** High

## 4. Missing UI to create new tickets
* **Where:** `client/src/features/tickets/TicketList.jsx`
* **What is wrong:** The backend has a `POST /api/tickets` route to create tickets, but there's no button or form on the frontend to actually do it.
* **Why it matters here:** The whole point of a helpdesk is for users to submit tickets, so missing the form completely breaks the main use case.
* **How you would fix it:** Build a basic `TicketForm` component and add a "New Ticket" button that opens it.
* **Severity:** High

## 5. SQL injection in ticket list sorting
* **Where:** `server/src/services/ticketService.js`, Line 38
* **What is wrong:** The `sortBy` and `order` query parameters are inserted straight into the SQL `ORDER BY` clause without being checked.
* **Why it matters here:** User-controlled sorting values are inserted into SQL without validation. This allows unexpected SQL expressions or identifiers to reach the query and may cause query errors, unintended behavior, or SQL injection depending on the query construction and database driver.
* **How you would fix it:** Check `sortBy` against an array of allowed column names and `order` against `asc`/`desc` before putting them in the query.
* **Severity:** High

## 6. Customers can see internal comments
* **Where:** `server/src/services/ticketService.js`, Line 71
* **What is wrong:** The API fetches all comments for a ticket, even the ones marked as internal (`is_internal = 1`), and sends them to the frontend.
* **Why it matters here:** Regular customers can look at the network tab in their browser and read private conversations between agents.
* **How you would fix it:** Check the user's role in the query. If they are a requester, add `AND c.is_internal = 0` to hide internal comments.
* **Severity:** Medium

## 7. Pagination bug hides the newest tickets
* **Where:** `server/src/services/ticketService.js`, Line 29
* **What is wrong:** The pagination offset formula is `const offset = page * PAGE_SIZE`.
* **Why it matters here:** Because `page` starts at 1, the first page skips the first 20 tickets. The newest tickets will never show up on the dashboard.
* **How you would fix it:** Change the formula to account for page 1: `const offset = (page - 1) * PAGE_SIZE;`.
* **Severity:** Medium

## 8. N+1 query performance issue on ticket list
* **Where:** `server/src/services/ticketService.js`, Lines 43-47
* **What is wrong:** The code runs a separate `SELECT COUNT(*)` query inside a loop for every single ticket on the page.
* **Why it matters here:** Loading 20 tickets means running 21 database queries. If multiple users load the page at once, it will flood the database and slow everything down.
* **How you would fix it:** Use a subquery to get the comment count directly inside the main `SELECT` statement, removing the loop entirely.
* **Severity:** Low
