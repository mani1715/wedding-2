import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  ArrowLeft, Coins, IndianRupee, Sparkles, Check, Loader2, CheckCircle2, XCircle, History,
} from 'lucide-react';
import '@/styles/luxury.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] } }),
};

// Load Razorpay Checkout JS on demand
const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = () => resolve(true);
  s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

const CreditsTopUp = () => {
  const navigate = useNavigate();
  const [packs, setPacks] = useState([]);
  const [balance, setBalance] = useState({ total_credits: 0, used_credits: 0, available_credits: 0 });
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [working, setWorking] = useState(null); // pack_id while busy
  const [toast, setToast] = useState(null);     // {type, message}

  const getAuth = () => {
    const t = localStorage.getItem('admin_token') || localStorage.getItem('adminToken') || localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, h] = await Promise.all([
        axios.get(`${API_URL}/api/admin/credit-packs`, { headers: getAuth() }),
        axios.get(`${API_URL}/api/admin/credits`, { headers: getAuth() }).catch(() => ({ data: balance })),
        axios.get(`${API_URL}/api/admin/credits/purchases`, { headers: getAuth() }),
      ]);
      setPacks(p.data?.packs || []);
      if (c.data) setBalance(c.data);
      setPurchases(h.data?.purchases || []);
    } catch (e) {
      if (e.response?.status === 401) navigate('/admin/login');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (type, message, ms = 4000) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), ms);
  };

  const buy = async (pack) => {
    setWorking(pack.id);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load Razorpay');

      const orderRes = await axios.post(
        `${API_URL}/api/admin/credits/purchase/create-order`,
        { pack_id: pack.id },
        { headers: getAuth() }
      );
      const order = orderRes.data;

      if (!order.razorpay_key_id || order.razorpay_key_id.includes('PLACEHOLDER')) {
        showToast('error', 'Razorpay keys not configured. Add real keys in backend/.env to enable live payments.');
        setWorking(null);
        return;
      }

      const adminEmail = (JSON.parse(localStorage.getItem('admin') || 'null') || {}).email;

      const options = {
        key: order.razorpay_key_id,
        amount: order.amount_paise,
        currency: order.currency || 'INR',
        order_id: order.order_id,
        name: 'Wedding Studio',
        description: `${pack.label} · ${pack.credits} credits`,
        prefill: adminEmail ? { email: adminEmail } : {},
        theme: { color: '#D4AF37' },
        handler: async (resp) => {
          try {
            const verify = await axios.post(`${API_URL}/api/admin/credits/purchase/verify`, {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }, { headers: getAuth() });
            const v = verify.data;
            setBalance({
              total_credits: v.total_credits,
              used_credits: v.used_credits,
              available_credits: v.available_credits,
            });
            showToast('success', `Credited ${v.credits_added} credits · new balance ${v.available_credits}`);
            load();
          } catch (e) {
            showToast('error', e.response?.data?.detail || 'Verification failed');
          } finally {
            setWorking(null);
          }
        },
        modal: {
          ondismiss: () => setWorking(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        showToast('error', 'Payment failed. No credits added.');
        setWorking(null);
      });
      rzp.open();
    } catch (e) {
      showToast('error', e.response?.data?.detail || e.message);
      setWorking(null);
    }
  };

  return (
    <div className="luxe min-h-screen" data-testid="credits-topup">
      <div className="px-4 md:px-12 py-8 md:py-10 max-w-[1300px] mx-auto">
        <button onClick={() => navigate('/admin/dashboard')} className="lux-btn lux-btn-ghost mb-6 inline-flex items-center gap-2" data-testid="topup-back">
          <ArrowLeft className="w-4 h-4" /> Studio
        </button>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
          <span className="lux-eyebrow block mb-3">◆ Credits</span>
          <h1 className="font-display text-[2.2rem] md:text-[3.6rem] leading-[1.05]" style={{ color: '#FFF8DC' }}>
            Top up <span className="font-script italic text-gold">your credits</span>
          </h1>
          <p className="mt-3 text-sm md:text-base max-w-2xl" style={{ color: 'rgba(255,248,220,0.62)' }}>
            Pick a pack, pay securely with Razorpay, and your credits land instantly — ready to publish your next masterpiece.
          </p>
        </motion.div>

        {/* Balance card */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="lux-glass p-6 md:p-7 mb-10 grid grid-cols-3 gap-4"
          style={{ border: '1px solid rgba(212,175,55,0.35)' }}
          data-testid="topup-balance">
          <Stat icon={<Coins className="w-4 h-4" />} label="Available" value={balance.available_credits} big />
          <Stat icon={<Sparkles className="w-4 h-4" />} label="Total ever added" value={balance.total_credits} />
          <Stat icon={<History className="w-4 h-4" />} label="Used" value={balance.used_credits} />
        </motion.div>

        {/* Packs grid */}
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} /></div>
        ) : packs.length === 0 ? (
          <div className="lux-glass p-10 text-center" data-testid="topup-empty">
            <Coins className="w-7 h-7 mx-auto mb-3" style={{ color: '#D4AF37' }} />
            <p className="text-sm" style={{ color: 'rgba(255,248,220,0.6)' }}>
              No packs available right now. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12" data-testid="topup-packs">
            {packs.map((pack, i) => (
              <motion.div key={pack.id}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="lux-glass p-7 relative flex flex-col"
                style={pack.badge ? {
                  border: '1px solid rgba(212,175,55,0.6)',
                  boxShadow: '0 22px 50px rgba(212,175,55,0.18)',
                  background: 'linear-gradient(160deg, rgba(212,175,55,0.06), rgba(26,20,15,0.95))',
                } : {}}
                data-testid={`topup-pack-${pack.id}`}
              >
                {pack.badge && (
                  <div className="absolute -top-3 left-6 px-3 py-1 rounded-full text-[9px] tracking-[0.25em] uppercase"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B8941F)', color: '#16110C', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                    {pack.badge}
                  </div>
                )}

                <span className="lux-eyebrow text-[9px] mb-2">◆ {pack.label}</span>

                <div className="my-3">
                  <div className="flex items-baseline gap-1">
                    <IndianRupee className="w-6 h-6 text-gold" />
                    <span className="font-display text-5xl text-gold leading-none">{pack.price_inr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="font-script italic text-2xl text-gold mt-2">
                    = {pack.credits.toLocaleString('en-IN')} credits
                  </div>
                </div>

                {pack.description && (
                  <p className="text-sm italic my-3" style={{ color: 'rgba(255,248,220,0.7)' }}>{pack.description}</p>
                )}

                <button
                  onClick={() => buy(pack)}
                  disabled={working === pack.id}
                  className="lux-btn mt-auto justify-center"
                  data-testid={`topup-buy-${pack.id}`}
                >
                  {working === pack.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Opening Razorpay…</>
                  ) : (
                    <>Pay ₹{pack.price_inr.toLocaleString('en-IN')}</>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recent purchases */}
        {purchases.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} data-testid="topup-history">
            <div className="mb-4 flex items-baseline gap-3">
              <span className="lux-eyebrow">◆ Recent purchases</span>
              <span className="text-xs" style={{ color: 'rgba(255,248,220,0.5)' }}>({purchases.length})</span>
            </div>
            <div className="lux-glass overflow-hidden">
              <table className="w-full text-sm">
                <thead style={{ background: 'rgba(212,175,55,0.06)' }}>
                  <tr style={{ color: 'rgba(255,248,220,0.55)' }}>
                    <Th>Date</Th><Th>Pack</Th><Th align="right">Amount</Th><Th align="right">Credits</Th><Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id} style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
                      <Td>{new Date(p.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</Td>
                      <Td style={{ color: '#FFF8DC' }}>{p.pack_label}</Td>
                      <Td align="right" style={{ color: '#D4AF37', fontWeight: 600 }}>₹{p.amount_inr.toLocaleString('en-IN')}</Td>
                      <Td align="right">+{p.credits}</Td>
                      <Td>
                        {p.credited ? (
                          <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#86efac' }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Credited
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'rgba(255,248,220,0.5)' }}>
                            {p.status}
                          </span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-6 z-[140] max-w-sm lux-glass p-4 flex items-start gap-3"
            style={{
              border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
            }}
            data-testid="topup-toast">
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#86efac' }} />
                                         : <XCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#fca5a5' }} />}
            <div className="text-sm" style={{ color: '#FFF8DC' }}>{toast.message}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Stat = ({ icon, label, value, big }) => (
  <div>
    <div className="flex items-center gap-1.5 text-[10px] tracking-[0.25em] uppercase mb-1.5" style={{ color: 'rgba(255,248,220,0.55)' }}>
      <span className="text-gold">{icon}</span> {label}
    </div>
    <div className={`font-display text-gold leading-none ${big ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl'}`}>{value}</div>
  </div>
);
const Th = ({ children, align = 'left' }) => (
  <th className="px-4 py-3 text-[10px] tracking-[0.25em] uppercase font-medium" style={{ textAlign: align }}>{children}</th>
);
const Td = ({ children, align = 'left', style, className = '' }) => (
  <td className={`px-4 py-3 ${className}`} style={{ textAlign: align, color: 'rgba(255,248,220,0.85)', ...style }}>{children}</td>
);

export default CreditsTopUp;
