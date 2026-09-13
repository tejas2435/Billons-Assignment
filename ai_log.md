# AI Usage Log

**Assistant Used:** Gemini / Antigravity / ChatGPT

**What I asked:**
Throughout the assignment, I relied on the AI as a pair-programming partner. Specifically, I asked the AI to:
- Read and understand the initial codebase structure and database schema.
- Help identify and verify internal application flaws (such as Cross-Tenant IDOR, XSS, missing UI features, missing role verification, and the N+1 query issue).
- Assist in writing, formatting, and refining the `review.md` documentation to ensure it was professional and properly ranked by severity.
- Help brainstorm and apply the architectural logic for Part 2 (SLA tracking), particularly constructing the pure-SQL breach calculation.
- Write the actual code changes to fix the Part 1 bugs and implement the Part 2 feature.

**Where the output was wrong or misleading and how I caught it:**

1. **Overstated XSS Impact in `TicketDetail.jsx`**
   The AI correctly identified a Cross-Site Scripting (XSS) vulnerability caused by `dangerouslySetInnerHTML` in the comments list. However, in its drafted review, the AI made an absolute claim: *"When an admin views the ticket, the script runs and can steal their login token."* 
   **How I caught it:** I realized this was slightly overstated. Stealing tokens via XSS isn't guaranteed depending on how authentication tokens are stored and protected (e.g., if `HttpOnly` cookies were used). I corrected the AI to use a more defensible explanation, stating instead that it *"could allow unauthorized actions as the victim or expose sensitive information accessible to that session."*

2. **Absolute Claims about SQL Injection in `ticketService.js`**
   The AI accurately spotted that user-controlled `sortBy` and `order` parameters were being directly injected into the `ORDER BY` clause. However, the AI confidently stated that this *"can still be used to slow down the database or extract data."*
   **How I caught it:** I recognized that making absolute claims about SQL extraction from an `ORDER BY` clause is arrogant without deeply analyzing the exact MySQL driver configuration, as it usually requires stacked queries or blind/time-based extraction. I corrected the AI's explanation to state that it *"allows unexpected SQL expressions to reach the query and may cause query errors or SQL injection depending on the query construction and database driver."*

3. **Misguided Approach to Part 2 (SLA Tracking)**
   When brainstorming how to calculate SLA breaches, the AI initially suggested pulling all tickets into Node.js, looping over them, and querying the `comments` table for each ticket to find the first response time.
   **How I caught it:** While analyzing the codebase for Part 1, I had just documented an existing **N+1 query problem** in `listTickets` where comment counts were being fetched in a loop. I caught that the AI's suggested approach for Part 2 would severely worsen this exact bottleneck. I rejected the AI's Javascript-loop approach and instead designed a pure-SQL solution using `COALESCE` and a subquery to compute the SLA state entirely in the database layer.
