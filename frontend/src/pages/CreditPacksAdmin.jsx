import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  ArrowLeft, Plus, Edit3, Trash2, Save, X, Loader2,
  CheckCircle2, IndianRupee, Coins, Sparkles, ToggleLeft, ToggleRight,
} from 'lucide-react';
import '@/styles/luxury.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] } }),
};

const CreditPacksAdmin = () => {
  const navigate = useNavigate();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // pack object or 'new'
  const [saving, setSaving] = useState(false);

  const getAuth = () => {
    const t = localStorage.getItem('admin_token') || localStorage.getItem('adminToken') || localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_URL}/api/super-admin/credit-packs`, { headers: getAuth() });
      setPacks(r.data?.packs || []);
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        navigate('/super-admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.label || !editing.price_inr || !editing.credits) {
      alert('Label, price and credits are required'); return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        await axios.put(`${API_URL}/api/super-admin/credit-packs/${editing.id}`, editing, { headers: getAuth() });
      } else {
        await axios.post(`${API_URL}/api/super-admin/credit-packs`, editing, { headers: getAuth() });
      }
      setEditing(null);
      await load();
    } catch (e) {
      alert('Could not save pack: ' + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this credit pack? Past purchases are unaffected.')) return;
    try {
      await axios.delete(`${API_URL}/api/super-admin/credit-packs/${id}`, { headers: getAuth() });
      await load();
    } catch (e) {
      alert('Could not delete: ' + (e.response?.data?.detail || e.message));
    }
  };

  const toggleActive = async (pack) => {
    try {
      await axios.put(`${API_URL}/api/super-admin/credit-packs/${pack.id}`, { is_active: !pack.is_active }, { headers: getAuth() });
      await load();
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="luxe min-h-screen" data-testid="credit-packs-admin">
      <div className="px-4 md:px-12 py-8 md:py-10 max-w-[1300px] mx-auto">
        <button onClick={() => navigate('/super-admin/dashboard')} className="lux-btn lux-btn-ghost mb-6 inline-flex items-center gap-2" data-testid="cp-back">
          <ArrowLeft className="w-4 h-4" /> Super Admin Dashboard
        </button>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="lux-eyebrow block mb-3">◆ Monetization</span>
            <h1 className="font-display text-[2.2rem] md:text-[3.4rem] leading-[1.05]" style={{ color: '#FFF8DC' }}>
              Credit <span className="font-script italic text-gold">packs</span>
            </h1>
            <p className="mt-3 text-sm md:text-base max-w-xl" style={{ color: 'rgba(255,248,220,0.62)' }}>
              Define how much INR translates to how many credits. Changes are live instantly — photographers see your pricing on their top-up screen.
            </p>
          </div>
          <button onClick={() => setEditing({ label: '', price_inr: 500, credits: 50, is_active: true, sort_order: (packs.length + 1) })}
            className="lux-btn inline-flex items-center gap-2" data-testid="cp-add-new">
            <Plus className="w-4 h-4" /> Add a new pack
          </button>
        </motion.div>

        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} /></div>
        ) : packs.length === 0 ? (
          <div className="lux-glass p-10 text-center" data-testid="cp-empty">
            <Coins className="w-7 h-7 mx-auto mb-3" style={{ color: '#D4AF37' }} />
            <p className="text-sm" style={{ color: 'rgba(255,248,220,0.6)' }}>
              No packs yet. Tap "Add a new pack" above to set your first pricing tier.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="cp-list">
            {packs.map((pack, i) => (
              <motion.div key={pack.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="lux-glass p-6 relative"
                style={pack.badge ? { border: '1px solid rgba(212,175,55,0.55)', boxShadow: '0 18px 38px rgba(212,175,55,0.12)' } : {}}
                data-testid={`cp-card-${pack.id}`}
              >
                {pack.badge && (
                  <div className="absolute -top-3 left-5 px-3 py-1 rounded-full text-[9px] tracking-[0.25em] uppercase"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B8941F)', color: '#16110C', fontFamily: 'DM Sans, sans-serif' }}>
                    {pack.badge}
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display text-2xl" style={{ color: '#FFF8DC' }}>{pack.label}</h3>
                  <button onClick={() => toggleActive(pack)}
                    className="shrink-0" title={pack.is_active ? 'Active' : 'Inactive'}
                    data-testid={`cp-toggle-${pack.id}`}>
                    {pack.is_active ? <ToggleRight className="w-7 h-7 text-gold" /> : <ToggleLeft className="w-7 h-7" style={{ color: 'rgba(255,248,220,0.4)' }} />}
                  </button>
                </div>

                <div className="my-4">
                  <div className="flex items-baseline gap-1">
                    <IndianRupee className="w-5 h-5 text-gold" />
                    <span className="font-display text-4xl text-gold leading-none">{pack.price_inr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-xs tracking-[0.25em] uppercase mt-2" style={{ color: 'rgba(255,248,220,0.55)' }}>
                    = {pack.credits.toLocaleString('en-IN')} credits
                  </div>
                </div>

                {pack.description && (
                  <p className="text-sm italic mb-4" style={{ color: 'rgba(255,248,220,0.7)' }}>{pack.description}</p>
                )}

                <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'rgba(212,175,55,0.15)' }}>
                  <button onClick={() => setEditing({ ...pack })} className="lux-btn lux-btn-ghost text-xs inline-flex items-center gap-1.5" data-testid={`cp-edit-${pack.id}`}>
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => remove(pack.id)} className="lux-btn lux-btn-ghost text-xs inline-flex items-center gap-1.5 ml-auto" data-testid={`cp-delete-${pack.id}`}
                    style={{ color: '#fca5a5' }}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <EditPackModal
            pack={editing}
            setPack={setEditing}
            onSave={save}
            onClose={() => setEditing(null)}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const EditPackModal = ({ pack, setPack, onSave, onClose, saving }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-6"
    style={{ background: 'rgba(8,6,4,0.85)', backdropFilter: 'blur(10px)' }}
    onClick={onClose}
    data-testid="cp-modal"
  >
    <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full md:max-w-lg lux-glass"
      style={{ borderRadius: '1.5rem 1.5rem 0 0', padding: '1.75rem',
        background: 'linear-gradient(180deg, rgba(26,20,15,0.98), rgba(15,11,8,0.99))',
        border: '1px solid rgba(212,175,55,0.2)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <span className="lux-eyebrow block mb-1.5">◆ {pack.id ? 'Edit pack' : 'New pack'}</span>
          <h3 className="font-display text-2xl" style={{ color: '#FFF8DC' }}>
            Pricing <span className="font-script italic text-gold">setup</span>
          </h3>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full grid place-items-center" style={{ background: 'rgba(255,248,220,0.08)', color: 'rgba(255,248,220,0.8)' }} data-testid="cp-modal-close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <Field label="Label">
          <input value={pack.label} maxLength={60} onChange={(e) => setPack({ ...pack, label: e.target.value })}
            placeholder="Starter · Studio · Atelier" style={inp} data-testid="cp-field-label" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (INR)">
            <input type="number" value={pack.price_inr} min={1} onChange={(e) => setPack({ ...pack, price_inr: parseInt(e.target.value, 10) || 0 })}
              style={inp} data-testid="cp-field-price" />
          </Field>
          <Field label="Credits given">
            <input type="number" value={pack.credits} min={1} onChange={(e) => setPack({ ...pack, credits: parseInt(e.target.value, 10) || 0 })}
              style={inp} data-testid="cp-field-credits" />
          </Field>
        </div>

        <Field label="Description (optional)">
          <input value={pack.description || ''} maxLength={140} onChange={(e) => setPack({ ...pack, description: e.target.value })}
            placeholder="What's included…" style={inp} data-testid="cp-field-desc" />
        </Field>

        <Field label="Badge (optional)">
          <input value={pack.badge || ''} maxLength={20} onChange={(e) => setPack({ ...pack, badge: e.target.value })}
            placeholder="Most Popular · Best Value" style={inp} data-testid="cp-field-badge" />
        </Field>

        <div className="grid grid-cols-2 gap-3 items-end">
          <Field label="Sort order">
            <input type="number" value={pack.sort_order || 0} onChange={(e) => setPack({ ...pack, sort_order: parseInt(e.target.value, 10) || 0 })}
              style={inp} data-testid="cp-field-sort" />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg" style={{ border: '1px solid rgba(212,175,55,0.18)' }}>
            <input type="checkbox" checked={!!pack.is_active} onChange={(e) => setPack({ ...pack, is_active: e.target.checked })}
              data-testid="cp-field-active" />
            <span className="text-sm" style={{ color: '#FFF8DC' }}>Active</span>
          </label>
        </div>

        <button onClick={onSave} disabled={saving}
          className="lux-btn w-full justify-center" data-testid="cp-save">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {pack.id ? 'Save changes' : 'Create pack'}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const inp = {
  width: '100%', padding: '0.85rem 1rem', background: 'transparent', color: '#FFF8DC',
  border: '1px solid rgba(212,175,55,0.18)', borderRadius: '0.5rem', outline: 'none',
  caretColor: '#D4AF37', fontSize: '0.95rem',
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,248,220,0.55)' }}>{label}</span>
    {children}
  </label>
);

export default CreditPacksAdmin;
