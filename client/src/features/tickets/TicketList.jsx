import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { api } from '../../app/api';

const STATUSES = ['', 'open', 'pending', 'resolved', 'closed'];
const PRIORITIES = ['', 'P1', 'P2', 'P3'];

export default function TicketList() {
  const user = useSelector((s) => s.auth.user);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  // NEW: breached filter state
  const [breached, setBreached] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newPriority, setNewPriority] = useState('P3');

  useEffect(() => {
    setLoading(true);
    // OLD: const params = new URLSearchParams({ page, search, status, priority, sortBy, order: 'desc' });
    const params = new URLSearchParams({ page, search, status, priority, sortBy, order: 'desc' });
    if (breached) params.append('breached', 'true');
    api(`/tickets?${params.toString()}`)
      .then((data) => {
        setRows(data.rows);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // OLD: }, [page]);
  }, [page, search, status, priority, sortBy, breached]);

  async function handleDelete(id) {
    await api(`/tickets/${id}`, { method: 'DELETE' });
    setRows(rows.filter((r) => r.id !== id));
  }

  async function handleCreate(e) {
    e.preventDefault();
    const created = await api('/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject: newSubject, body: newBody, priority: newPriority })
    });
    setRows([created, ...rows]);
    setShowCreate(false);
    setNewSubject('');
    setNewBody('');
  }

  const pageCount = Math.ceil(total / 20);

  return (
    <div className="ticket-list">
      {/* OLD: <h1>Tickets</h1> */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Tickets</h1>
        <button onClick={() => setShowCreate(true)}>New Ticket</button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="create-form" style={{ marginBottom: 20, padding: 10, border: '1px solid #ccc' }}>
          <h3>Create New Ticket</h3>
          <input required placeholder="Subject" value={newSubject} onChange={e => setNewSubject(e.target.value)} style={{ display: 'block', marginBottom: 10, width: '100%' }} />
          <textarea required placeholder="Body" value={newBody} onChange={e => setNewBody(e.target.value)} style={{ display: 'block', marginBottom: 10, width: '100%', height: 80 }} />
          <select value={newPriority} onChange={e => setNewPriority(e.target.value)} style={{ marginBottom: 10 }}>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit">Submit</button>
            <button type="button" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="filters">
        <input
          placeholder="Search subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || 'Any status'}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p || 'Any priority'}</option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="created_at">Created</option>
          <option value="updated_at">Updated</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
        </select>
        {/* NEW: SLA breached filter checkbox */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input type="checkbox" checked={breached} onChange={(e) => setBreached(e.target.checked)} />
          Breached only
        </label>
      </div>

      {loading && <p>Loading…</p>}

      <table>
        <thead>
          <tr>
            <th>#</th><th>Subject</th><th>Status</th><th>Priority</th>
            <th>Assignee</th><th>Comments</th><th>Created</th><th />
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr key={i}>
              <td>{t.id}</td>
              <td><Link to={`/tickets/${t.id}`}>{t.subject}</Link></td>
              {/* OLD: <td>{t.status}</td> */}
              <td>
                {t.status}
                {t.is_breached ? <span style={{ backgroundColor: 'red', color: 'white', padding: '2px 4px', borderRadius: 4, marginLeft: 8, fontSize: '0.8em' }}>Breached</span> : null}
              </td>
              <td>{t.priority}</td>
              <td>{t.assignee_name || '—'}</td>
              <td>{t.comment_count}</td>
              <td>{new Date(t.created_at).toLocaleString()}</td>
              <td>
                {user?.role === 'admin' && (
                  <button onClick={() => handleDelete(t.id)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pager">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page} of {pageCount || 1} · {total} tickets</span>
        <button disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
