import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Users, UserPlus, Wallet, ShieldCheck, ShieldOff, Plus, Minus,
  Search, TrendingUp, FileText, Crown, X, Check, Eye, Coins, FilePlus2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LuxuryShell from '@/components/luxury/LuxuryShell';
import MandalaLoader from '@/components/luxury/MandalaLoader';
import ScrollSection from '@/components/luxury/ScrollSection';
import '@/styles/luxury.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  visible: (i = 0) => ({ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] } }),
};

const LuxurySuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { admin, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('admins');
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creditModal, setCreditModal] = useState(null);  // { admin, mode: 'add'|'deduct' }
  const [ledgerFor, setLedgerFor] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (authLoading) return; // wait for auth to hydrate from localStorage
    if (!admin) { navigate('/super-admin/login'); return; }
    if (admin.role !== 'super_admin' && admin.role !== 'SUPER_ADMIN') { navigate('/admin/dashboard'); return; }
    fetchAdmins();
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, authLoading]);

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/super-admin/admins`);
      setAdmins(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/audit-logs`);
      setAuditLogs(res.data || []);
    } catch (e) { /* optional */ }
  };

  const fetchLedger = async (a) => {
    try {
      const res = await axios.get(`${API_URL}/api/super-admin/credits/ledger/${a.id}`);
      setLedger(res.data || []);
      setLedgerFor(a);
    } catch (e) { setLedger([]); setLedgerFor(a); }
  };

  const stats = useMemo(() => {
    const photographers = admins.filter((a) => a.role === 'admin');
    const totalCredits = photographers.reduce((s, a) => s + (a.total_credits || 0), 0);
    const usedCredits  = photographers.reduce((s, a) => s + (a.used_credits || 0), 0);
    const activeCount  = photographers.filter((a) => a.status === 'active').length;
    return {
      photographers: photographers.length,
      active: activeCount,
      totalCredits, usedCredits,
      availableCredits: totalCredits - usedCredits,
    };
  }, [admins]);

  const filteredAdmins = useMemo(() => {
    const photographers = admins.filter((a) => a.role === 'admin');
    if (!search.trim()) return photographers;
    const q = search.toLowerCase();
    return photographers.filter((a) =>
      (a.email || '').toLowerCase().includes(q) ||
      (a.name || '').toLowerCase().includes(q)
    );
  }, [admins, search]);

  const toggleStatus = async (a) => {
    const newStatus = a.status === 'active' ? 'suspended' : 'active';
    try {
      await axios.put(`${API_URL}/api/super-admin/admins/${a.id}/status`, { status: newStatus });
      fetchAdmins();
    } catch (e) { alert(e.response?.data?.detail || 'Failed to update status'); }
  };

  return (
    <LuxuryShell
      eyebrow="◆ Platform Sovereignty"
      title="Super Admin Console"
      showCredits={false}
      testid="luxury-super-admin-dashboard"
    >
      <div className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto">
        {/* Header */}
        <ScrollSection className="mb-12">
          <span className="lux-eyebrow block mb-4">◆ Platform Control</span>
          <h1 className="font-display text-[2.6rem] md:text-[4rem] leading-[1.02] tracking-tight" style={{ color: '#FFF8DC' }}>
            Sovereign <span className="text-gold italic font-script">command.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[1.02rem]" style={{ color: 'rgba(255,248,220,0.65)' }}>
            Manage every photographer, credit, theme and feature flag from one console.
          </p>
        </ScrollSection>

        {/* Stat tiles */}
        <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Photographers"    value={stats.photographers} icon={Users}      testid="stat-photographers" />
          <Stat label="Active Studios"   value={stats.active}        icon={ShieldCheck} testid="stat-active" />
          <Stat label="Credits Issued"   value={stats.totalCredits}  icon={Wallet}     testid="stat-credits-issued" />
          <Stat label="Credits Consumed" value={stats.usedCredits}   icon={TrendingUp} testid="stat-credits-used" />
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[{ id: 'admins', label: 'Photographers' }, { id: 'audit', label: 'Audit Log' }, { id: 'plans', label: 'Plans & Pricing' }].map((t) => (
            <button
              key={t.id} onClick={() => setTab(t.id)}
              className="px-5 py-2 rounded-full text-xs tracking-[0.25em] uppercase transition-all"
              style={tab === t.id
                ? { background: '#D4AF37', color: '#16110C', fontWeight: 600 }
                : { background: 'transparent', color: 'rgba(255,248,220,0.7)', border: '1px solid var(--lux-border)' }}
              data-testid={`tab-${t.id}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Action bar */}
        {tab === 'admins' && (
          <div className="lux-glass p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowCreate(true)} className="lux-btn" data-testid="create-admin-btn">
                <UserPlus className="w-4 h-4" /> Create Photographer
              </button>
              <button onClick={() => navigate('/admin/profile/new?as=super-admin')} className="lux-btn lux-btn-ghost" data-testid="sa-create-invitation-btn">
                <FilePlus2 className="w-4 h-4" /> Create Invitation
              </button>
              <button onClick={() => navigate('/super-admin/credit-packs')} className="lux-btn lux-btn-ghost" data-testid="credit-packs-btn">
                <Coins className="w-4 h-4" /> Credit Packs
              </button>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,248,220,0.45)' }} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-transparent outline-none text-sm"
                style={{ color: '#FFF8DC', border: '1px solid var(--lux-border)' }}
                data-testid="search-admins"
              />
            </div>
          </div>
        )}

        {/* Tab content */}
        {tab === 'admins' && (
          loading ? (
            <div className="py-20 grid place-items-center"><MandalaLoader /></div>
          ) : filteredAdmins.length === 0 ? (
            <div className="lux-glass p-10 text-center">
              <p className="font-display text-2xl mb-2" style={{ color: '#FFF8DC' }}>No photographers yet</p>
              <p className="text-sm" style={{ color: 'rgba(255,248,220,0.6)' }}>Create your first studio above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="admins-list">
              {filteredAdmins.map((a, i) => (
                <motion.div key={a.id} variants={fadeUp} custom={i} initial="hidden" animate="visible"
                  className="lux-glass p-6"
                  data-testid={`admin-row-${a.id}`}
                >
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl mb-0.5 truncate" style={{ color: '#FFF8DC' }}>{a.name || a.email}</h3>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,248,220,0.55)' }}>{a.email}</p>
                    </div>
                    <span className="text-[9px] tracking-[0.25em] uppercase px-2 py-1 rounded-full shrink-0"
                      style={a.status === 'active'
                        ? { background: 'rgba(138,154,91,0.16)', color: '#A5B97A', border: '1px solid rgba(138,154,91,0.35)' }
                        : { background: 'rgba(139,0,0,0.18)', color: '#FFB0A0', border: '1px solid rgba(139,0,0,0.4)' }}>
                      {a.status}
                    </span>
                  </div>

                  <div className="lux-hairline mb-4" />

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <Mini label="Total"     value={a.total_credits ?? 0} />
                    <Mini label="Used"      value={a.used_credits ?? 0} />
                    <Mini label="Available" value={(a.total_credits ?? 0) - (a.used_credits ?? 0)} highlight />
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <ActionBtn icon={Eye}      label="Details" onClick={() => navigate(`/super-admin/photographers/${a.id}`)} testid={`view-detail-${a.id}`} />
                    <ActionBtn icon={Plus}    label="Add"    onClick={() => setCreditModal({ admin: a, mode: 'add' })}    testid={`add-credits-${a.id}`} />
                    <ActionBtn icon={Minus}   label="Deduct" onClick={() => setCreditModal({ admin: a, mode: 'deduct' })} testid={`deduct-credits-${a.id}`} />
                    <ActionBtn icon={FileText} label="Ledger" onClick={() => fetchLedger(a)} testid={`ledger-${a.id}`} />
                    <ActionBtn icon={a.status === 'active' ? ShieldOff : ShieldCheck}
                      label={a.status === 'active' ? 'Suspend' : 'Activate'}
                      onClick={() => toggleStatus(a)} testid={`toggle-status-${a.id}`} danger={a.status === 'active'} />
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}

        {tab === 'audit' && (
          <div className="lux-glass p-6">
            <h3 className="font-display text-2xl mb-4" style={{ color: '#FFF8DC' }}>Audit Trail</h3>
            {auditLogs.length === 0 ? (
              <p className="text-sm" style={{ color: 'rgba(255,248,220,0.6)' }}>No audit entries yet.</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2" data-testid="audit-logs-list">
                {auditLogs.slice(0, 100).map((log) => (
                  <div key={log.id} className="px-4 py-3 rounded-lg flex items-center justify-between gap-4"
                    style={{ background: 'rgba(255,248,220,0.03)', border: '1px solid var(--lux-border)' }}>
                    <div className="min-w-0 flex-1">
                      <div className="font-heading text-sm truncate" style={{ color: '#FFF8DC' }}>{log.action || log.event}</div>
                      <div className="text-xs truncate" style={{ color: 'rgba(255,248,220,0.5)' }}>{log.details || log.description || ''}</div>
                    </div>
                    <div className="text-xs whitespace-nowrap" style={{ color: 'rgba(255,248,220,0.45)' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'plans' && (
          <div className="lux-glass p-8">
            <h3 className="font-display text-2xl mb-3" style={{ color: '#FFF8DC' }}>Plan Configuration</h3>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,248,220,0.6)' }}>
              Plans are statically configured in <span className="font-mono text-gold">/app/frontend/src/themes/masterThemes.js</span>.
              Configure on a per-photographer basis below.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['FREE', 'SILVER', 'GOLD', 'PLATINUM'].map((p) => (
                <div key={p} className="p-5 rounded-xl"
                  style={{ background: 'rgba(255,248,220,0.04)', border: '1px solid var(--lux-border)' }}>
                  <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,248,220,0.55)' }}>Plan</div>
                  <div className="font-display text-2xl mb-3" style={{ color: '#FFF8DC' }}>{p}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,248,220,0.55)' }}>
                    {p === 'FREE' && 'Watermark · Royal Mughal'}
                    {p === 'SILVER' && '4 themes · no watermark'}
                    {p === 'GOLD' && '8 themes · AI · live gallery'}
                    {p === 'PLATINUM' && 'All 10 themes · 3D'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateAdminModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchAdmins(); }} />}
      {creditModal && <CreditModal data={creditModal} onClose={() => setCreditModal(null)} onDone={() => { setCreditModal(null); fetchAdmins(); }} />}
      {ledgerFor && <LedgerModal admin={ledgerFor} ledger={ledger} onClose={() => { setLedgerFor(null); setLedger([]); }} />}
    </LuxuryShell>
  );
};

const Stat = ({ label, value, icon: Icon, testid }) => (
  <motion.div variants={fadeUp} className="lux-glass p-5 flex flex-col gap-3" data-testid={testid}>
    <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,248,220,0.55)' }}>
      <Icon className="w-3.5 h-3.5" style={{ color: '#D4AF37' }} /> {label}
    </div>
    <div className="font-display text-4xl text-gold leading-none">{value}</div>
  </motion.div>
);

const Mini = ({ label, value, highlight }) => (
  <div className="text-center">
    <div className="text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: 'rgba(255,248,220,0.5)' }}>{label}</div>
    <div className={`font-display text-xl ${highlight ? 'text-gold' : ''}`} style={!highlight ? { color: '#FFF8DC' } : {}}>{value}</div>
  </div>
);

const ActionBtn = ({ icon: Icon, label, onClick, testid, danger }) => (
  <button onClick={onClick} data-testid={testid}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
    style={{
      background: 'transparent',
      color: danger ? '#FFB0A0' : 'rgba(255,248,220,0.78)',
      border: `1px solid ${danger ? 'rgba(139,0,0,0.4)' : 'var(--lux-border)'}`,
    }}
  >
    <Icon className="w-3 h-3" /> {label}
  </button>
);

const ModalShell = ({ title, eyebrow, onClose, children, testid }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[70] flex items-center justify-center p-4 luxe luxe-grain"
    style={{ background: 'rgba(8,5,3,0.7)', backdropFilter: 'blur(8px)' }}
    onClick={onClose}
    data-testid={testid}
  >
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      onClick={(e) => e.stopPropagation()}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="lux-glass relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-8"
      style={{ background: 'rgba(14,10,6,0.95)' }}
    >
      <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full grid place-items-center"
        style={{ color: 'rgba(255,248,220,0.6)', border: '1px solid var(--lux-border)' }}>
        <X className="w-4 h-4" />
      </button>
      {eyebrow && <span className="lux-eyebrow block mb-3">◆ {eyebrow}</span>}
      <h2 className="font-display text-2xl md:text-3xl mb-6" style={{ color: '#FFF8DC' }}>{title}</h2>
      {children}
    </motion.div>
  </motion.div>
);

const labelStyle = { color: 'rgba(255,248,220,0.55)' };
const inputStyle = {
  width: '100%', padding: '0.85rem 1rem', background: 'transparent', color: '#FFF8DC',
  border: '1px solid var(--lux-border)', borderRadius: '0.5rem', outline: 'none',
  fontFamily: 'Manrope, sans-serif', fontSize: '0.92rem', caretColor: '#D4AF37',
};

const CreateAdminModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ email: '', password: '', name: '', initial_credits: 50 });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  // Friendly error formatter — converts pydantic validation arrays into readable lines
  const friendlyError = (detail) => {
    if (!detail) return 'Failed to create photographer';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => {
        const field = (d.loc || []).slice(-1)[0] || 'field';
        return `${field}: ${d.msg || 'invalid'}`;
      }).join(' · ');
    }
    return JSON.stringify(detail);
  };

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    if ((form.password || '').length < 8) {
      setErr('Password must be at least 8 characters long');
      setBusy(false);
      return;
    }
    try {
      await axios.post(`${API_URL}/api/super-admin/admins`, {
        email: form.email, password: form.password, name: form.name,
        initial_credits: parseInt(form.initial_credits, 10) || 0,
      });
      onCreated();
    } catch (ex) { setErr(friendlyError(ex.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  return (
    <ModalShell title="Create Photographer" eyebrow="New Studio" onClose={onClose} testid="create-admin-modal">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Studio Name"><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Mani's Studio" data-testid="new-admin-name" /></Field>
        <Field label="Email"><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="studio@example.com" data-testid="new-admin-email" /></Field>
        <Field label="Password (min 8 characters)"><input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inputStyle} placeholder="At least 8 characters" data-testid="new-admin-password" /></Field>
        <Field label="Initial Credits"><input type="number" min={0} required value={form.initial_credits} onChange={(e) => setForm({ ...form, initial_credits: e.target.value })} style={inputStyle} data-testid="new-admin-credits" /></Field>
        {err && <div className="text-sm px-3 py-2.5 rounded-md flex items-start gap-2" style={{ background: 'rgba(139,0,0,0.18)', color: '#FFD7C9', border: '1px solid rgba(139,0,0,0.4)' }} data-testid="create-admin-error">
          <X className="w-4 h-4 shrink-0 mt-0.5" /> {err}
        </div>}
        <button type="submit" disabled={busy} className="lux-btn w-full justify-center" data-testid="submit-create-admin">
          {busy ? 'Creating…' : 'Create Studio'} <Crown className="w-4 h-4" />
        </button>
      </form>
    </ModalShell>
  );
};

const CreditModal = ({ data, onClose, onDone }) => {
  const { admin, mode } = data;
  const [amount, setAmount] = useState(10); const [reason, setReason] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const path = mode === 'add' ? 'credits/add' : 'credits/deduct';
    try {
      await axios.post(`${API_URL}/api/super-admin/${path}`, {
        admin_id: admin.id, amount: parseInt(amount, 10) || 0, reason: reason || `Manual ${mode}`,
      });
      onDone();
    } catch (e) { setErr(e.response?.data?.detail || 'Failed'); }
    finally { setBusy(false); }
  };

  return (
    <ModalShell
      title={`${mode === 'add' ? 'Add' : 'Deduct'} Credits`}
      eyebrow={admin.name || admin.email}
      onClose={onClose} testid="credit-modal"
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Amount"><input type="number" min={1} required value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} data-testid="credit-amount" /></Field>
        <Field label="Reason"><input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Welcome bonus" style={inputStyle} data-testid="credit-reason" /></Field>
        {err && <div className="text-sm px-3 py-2 rounded-md" style={{ background: 'rgba(139,0,0,0.18)', color: '#FFD7C9' }}>{err}</div>}
        <button type="submit" disabled={busy} className="lux-btn w-full justify-center" data-testid="submit-credit-op">
          {busy ? 'Processing…' : `${mode === 'add' ? 'Add' : 'Deduct'} ${amount} credits`} <Check className="w-4 h-4" />
        </button>
      </form>
    </ModalShell>
  );
};

const LedgerModal = ({ admin, ledger, onClose }) => (
  <ModalShell title="Credit Ledger" eyebrow={admin.name || admin.email} onClose={onClose} testid="ledger-modal">
    {ledger.length === 0 ? (
      <p className="text-sm" style={{ color: 'rgba(255,248,220,0.6)' }}>No entries yet.</p>
    ) : (
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1" data-testid="ledger-entries">
        {ledger.map((entry) => {
          const positive = (entry.amount || 0) >= 0 && entry.transaction_type !== 'deduct' && entry.transaction_type !== 'consume';
          return (
            <div key={entry.id} className="px-4 py-3 rounded-lg flex items-center justify-between gap-4"
              style={{ background: 'rgba(255,248,220,0.03)', border: '1px solid var(--lux-border)' }}>
              <div className="min-w-0 flex-1">
                <div className="font-heading text-sm truncate" style={{ color: '#FFF8DC' }}>
                  {entry.transaction_type || entry.action || 'transaction'}
                </div>
                <div className="text-xs truncate" style={{ color: 'rgba(255,248,220,0.5)' }}>{entry.reason || ''}</div>
              </div>
              <div className="font-display text-lg whitespace-nowrap"
                style={{ color: positive ? '#D4AF37' : '#FFB0A0' }}>
                {positive ? '+' : ''}{entry.amount}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </ModalShell>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-[10px] tracking-[0.3em] uppercase mb-2" style={labelStyle}>{label}</span>
    {children}
  </label>
);

export default LuxurySuperAdminDashboard;
