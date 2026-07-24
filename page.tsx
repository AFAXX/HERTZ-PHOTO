'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { t, LOCALES, type Locale } from '@/lib/i18n';

interface AdminContract {
  id: string; contractNumber: string; customerName: string; customerEmail: string | null; customerPhone: string | null;
  vehiclePlate: string; vehicleModel: string; vehicleColor: string | null; status: string; createdAt: string;
  tokens: Array<{ id: string; token: string; expiresAt: string; usedAt: string | null; isExpired: boolean }>;
  photosSubmitted: number; photos: Array<{ key: string; label: string; fileName: string; uploadedAt: string }>;
}
interface ChecklistItem {
  id: string; key: string; label: string; labelEn: string | null; description: string | null; icon: string | null;
  required: boolean; completed: boolean; photoCount: number;
}
interface ValidatedContract {
  id: string; contractNumber: string; customerName: string; vehiclePlate: string; vehicleModel: string; vehicleColor: string | null; status: string;
}

const MAX_PHOTOS = 10;

function CarDiagram({ onSelect, photoCounts }: { onSelect: (key: string) => void; photoCounts: Record<string, number> }) {
  const g = (k: string) => photoCounts[k] || 0;
  const done = (k: string) => g(k) > 0;
  return (
    <svg viewBox="0 0 300 540" className="w-full max-w-[280px] mx-auto">
      <path d="M108 510 Q60 490 48 430 L48 110 Q48 55 108 32 L192 32 Q252 55 252 110 L252 430 Q240 490 192 510 Z" fill="rgba(0,0,0,0.06)" transform="translate(4,4)" />
      <path d="M108 510 Q60 490 48 430 L48 110 Q48 55 108 32 L192 32 Q252 55 252 110 L252 430 Q240 490 192 510 Z" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2.5" />
      <path d="M120 430 L120 490 Q150 510 180 490 L180 430 Q150 420 120 430 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
      <path d="M95 390 Q150 410 205 390 L185 350 Q150 365 115 350 Z" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.5" />
      <rect x="80" y="180" width="140" height="170" rx="20" fill="#e8ecf1" stroke="#b0b8c4" strokeWidth="1" />
      <path d="M95 180 Q150 160 205 180 L185 215 Q150 200 115 215 Z" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.5" />
      <path d="M120 110 L120 180 Q150 170 180 180 L180 110 Q150 100 120 110 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
      <rect x="38" y="365" width="12" height="20" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
      <rect x="250" y="365" width="12" height="20" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
      <ellipse cx="100" cy="478" rx="12" ry="8" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" />
      <ellipse cx="200" cy="478" rx="12" ry="8" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" />
      <ellipse cx="100" cy="60" rx="10" ry="7" fill="#fca5a5" stroke="#ef4444" strokeWidth="1.5" />
      <ellipse cx="200" cy="60" rx="10" ry="7" fill="#fca5a5" stroke="#ef4444" strokeWidth="1.5" />
      <ellipse cx="62" cy="155" rx="18" ry="28" fill="#334155" stroke="#1e293b" strokeWidth="2" />
      <ellipse cx="62" cy="155" rx="8" ry="14" fill="#64748b" />
      <ellipse cx="238" cy="155" rx="18" ry="28" fill="#334155" stroke="#1e293b" strokeWidth="2" />
      <ellipse cx="238" cy="155" rx="8" ry="14" fill="#64748b" />
      <ellipse cx="68" cy="420" rx="18" ry="26" fill="#334155" stroke="#1e293b" strokeWidth="2" />
      <ellipse cx="68" cy="420" rx="8" ry="13" fill="#64748b" />
      <ellipse cx="232" cy="420" rx="18" ry="26" fill="#334155" stroke="#1e293b" strokeWidth="2" />
      <ellipse cx="232" cy="420" rx="8" ry="13" fill="#64748b" />

      <g onClick={() => onSelect('front')} style={{ cursor: 'pointer' }}>
        <rect x="90" y="435" width="120" height="60" rx="10" fill={done('front') ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.05)'} stroke={done('front') ? '#22c55e' : '#94a3b8'} strokeWidth="1.5" strokeDasharray={done('front') ? 'none' : '5 3'} />
        {g('front') > 0 && <><circle cx="200" cy="445" r="9" fill="#22c55e" /><text x="200" y="449" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{g('front')}</text></>}
      </g>
      <g onClick={() => onSelect('back')} style={{ cursor: 'pointer' }}>
        <rect x="90" y="75" width="120" height="60" rx="10" fill={done('back') ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.05)'} stroke={done('back') ? '#22c55e' : '#94a3b8'} strokeWidth="1.5" strokeDasharray={done('back') ? 'none' : '5 3'} />
        {g('back') > 0 && <><circle cx="200" cy="85" r="9" fill="#22c55e" /><text x="200" y="89" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{g('back')}</text></>}
      </g>
      <g onClick={() => onSelect('passenger_side')} style={{ cursor: 'pointer' }}>
        <rect x="28" y="195" width="50" height="130" rx="10" fill={done('passenger_side') ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.05)'} stroke={done('passenger_side') ? '#22c55e' : '#94a3b8'} strokeWidth="1.5" strokeDasharray={done('passenger_side') ? 'none' : '5 3'} />
        {g('passenger_side') > 0 && <><circle cx="68" cy="205" r="9" fill="#22c55e" /><text x="68" y="209" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{g('passenger_side')}</text></>}
      </g>
      <g onClick={() => onSelect('driver_side')} style={{ cursor: 'pointer' }}>
        <rect x="222" y="195" width="50" height="130" rx="10" fill={done('driver_side') ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.05)'} stroke={done('driver_side') ? '#22c55e' : '#94a3b8'} strokeWidth="1.5" strokeDasharray={done('driver_side') ? 'none' : '5 3'} />
        {g('driver_side') > 0 && <><circle cx="262" cy="205" r="9" fill="#22c55e" /><text x="262" y="209" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{g('driver_side')}</text></>}
      </g>

      <text x="150" y="525" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="700" letterSpacing="1">FRONT</text>
      <text x="150" y="22" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="700" letterSpacing="1">BACK</text>
      <text x="14" y="265" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="600" transform="rotate(-90,14,265)" letterSpacing="0.5">PASSENGER</text>
      <text x="286" y="265" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="600" transform="rotate(90,286,265)" letterSpacing="0.5">DRIVER</text>
    </svg>
  );
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>('it');
  // Customer must explicitly pick a language before seeing the photo checklist.
  const [languageSelected, setLanguageSelected] = useState(false);
  const [mode, setMode] = useState<'loading' | 'admin' | 'customer' | 'completed'>('loading');
  const [token, setToken] = useState('');
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ contractNumber: '', customerName: '', customerEmail: '', customerPhone: '', vehiclePlate: '', vehicleModel: '', vehicleColor: '' });
  const [uploading, setUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [tokenDialog, setTokenDialog] = useState<{ contractId: string; contractNumber: string } | null>(null);
  const [generatedToken, setGeneratedToken] = useState<{ token: string; expiresAt: string; link: string } | null>(null);
  const [copied, setCopied] = useState('');
  const [contract, setContract] = useState<ValidatedContract | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const [localPreviews, setLocalPreviews] = useState<Record<string, string[]>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#token=')) { const tk = hash.replace('#token=', ''); setToken(tk); setMode('customer'); validateToken(tk); }
    else { setMode('admin'); loadContracts(); }
  }, []);

  const validateToken = async (tk: string) => {
    try {
      setError('');
      const res = await fetch('/api/token/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: tk }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid token'); if (res.status === 410) setMode('completed'); return; }
      setContract(data.contract); setChecklist(data.photoChecklist);
      const counts: Record<string, number> = {};
      data.photoChecklist.forEach((item: ChecklistItem) => { counts[item.key] = item.photoCount; });
      setPhotoCounts(counts);
    } catch { setError(t(locale, 'landing.connectionError')); }
  };

  const openCamera = (key: string) => {
    const count = photoCounts[key] || 0;
    if (count >= MAX_PHOTOS) { setError(t(locale, 'checklist.maxPhotosReached')); return; }
    const item = checklist.find(c => c.key === key);
    if (!item) return;
    setActiveKey(key); setError('');
    // CRITICAL: reset value BEFORE clicking so camera reopens on mobile
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => fileInputRef.current?.click(), 150);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !activeKey || !contract) return;
    const item = checklist.find(c => c.key === activeKey);
    if (!item) return;
    const remaining = MAX_PHOTOS - (photoCounts[activeKey] || 0);
    const toUpload = Array.from(files).slice(0, remaining);
    for (const file of toUpload) {
      setUploadingPhoto(activeKey);
      try {
        const fd = new FormData();
        fd.append('token', token); fd.append('photo', file); fd.append('requirementId', item.id);
        const res = await fetch('/api/photos/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        // Create and track object URL to prevent memory leak
        const objectUrl = URL.createObjectURL(file);
        objectUrlsRef.current.push(objectUrl);
        setLocalPreviews(p => ({ ...p, [activeKey!]: [...(p[activeKey!] || []), objectUrl] }));
        setPhotoCounts(p => ({ ...p, [activeKey!]: (p[activeKey!] || 0) + 1 }));
        setChecklist(p => p.map(c => c.key === activeKey ? { ...c, completed: true, photoCount: c.photoCount + 1 } : c));
      } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Upload failed'); }
      finally { setUploadingPhoto(null); }
    }
    // Reset AFTER upload so next openCamera call works
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalPhotos = Object.values(photoCounts).reduce((s, c) => s + c, 0);

  // Only Italian (default) and English (set by admin) labels exist in the DB.
  // Every other language falls back to Italian for the requirement label itself,
  // while all surrounding UI copy still uses the chosen locale via t().
  const getLabel = (item: ChecklistItem) => (locale === 'en' && item.labelEn ? item.labelEn : item.label);

  const handleSubmit = async () => {
    if (totalPhotos === 0 || isSubmitting) return;
    setIsSubmitting(true); setError('');
    try {
      const res = await fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submit failed');
      setMode('completed');
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Submit failed'); }
    finally { setIsSubmitting(false); }
  };

  const loadContracts = async () => { try { const r = await fetch('/api/admin/contracts'); if (r.ok) setContracts((await r.json()).contracts || []); } catch {} };
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await fetch('/api/admin/contracts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createForm) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
      setShowCreate(false); setCreateForm({ contractNumber: '', customerName: '', customerEmail: '', customerPhone: '', vehiclePlate: '', vehicleModel: '', vehicleColor: '' });
      if (d.accessToken) setGeneratedToken(d.accessToken); loadContracts();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Failed'); }
  };
  const handleGenerateToken = async (cid: string) => {
    try { const r = await fetch('/api/admin/tokens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contractId: cid }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setGeneratedToken(d.accessToken); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Failed'); }
  };
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true); setBulkResult(null);
    try { const fd = new FormData(); fd.append('file', file); const r = await fetch('/api/admin/bulk-upload', { method: 'POST', body: fd }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setBulkResult(d); loadContracts(); }
    catch (err: unknown) { alert(err instanceof Error ? err.message : 'Failed'); }
    finally { setUploading(false); if (e.target) e.target.value = ''; }
  };
  const copyToClip = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(''), 2000); };
  const statusBadge = (s: string) => s === 'completed' ? 'bg-green-100 text-green-800' : s === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600';

  // Filter contracts based on search query and status filter
  const filteredContracts = useCallback(() => {
    let result = contracts;
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c =>
        c.contractNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.vehiclePlate.toLowerCase().includes(q) ||
        c.vehicleModel.toLowerCase().includes(q) ||
        (c.customerEmail && c.customerEmail.toLowerCase().includes(q))
      );
    }
    return result;
  }, [contracts, searchQuery, statusFilter]);

  /* LOADING */
  if (mode === 'loading') return (<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}><div className="animate-spin h-10 w-10 border-4 border-yellow-400 border-t-transparent rounded-full" /></div>);

  /* COMPLETED */
  if (mode === 'completed') return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t(locale, 'confirm.title')}</h1>
        <p className="text-gray-600">{t(locale, 'confirm.subtitle')}</p>
        <div className="mt-8 p-4 bg-gray-50 rounded-xl"><p className="text-gray-500 text-xs">Grazie per aver scelto Hertz Malta</p></div>
      </div>
    </div>
  );

  /* CUSTOMER — mandatory language selection */
  if (mode === 'customer' && !languageSelected) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-gray-900">HERTZ MALTA</h1>
          <p className="text-sm text-gray-500 mt-1">Choose your language / Scegli la tua lingua</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LOCALES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLocale(l.code); setLanguageSelected(true); }}
              className="px-3 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 hover:border-yellow-400 hover:bg-yellow-50 transition-colors active:scale-[0.98]"
            >
              {l.nativeName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* CUSTOMER */
  if (mode === 'customer') return (
    <div className="min-h-screen bg-gray-50">
      {/* Removed capture="environment" to fix mobile multiple upload; removed "multiple" to avoid iOS Safari conflict */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />

      <div style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div><h1 className="text-lg font-bold text-white">HERTZ MALTA</h1><p className="text-xs" style={{ color: '#FFCB05' }}>{t(locale, 'app.title')}</p></div>
            {contract && <div className="text-right"><p className="text-xs text-gray-400">{t(locale, 'confirm.contract')}</p><p className="text-sm font-semibold text-white">{contract.contractNumber}</p></div>}
          </div>
          <button onClick={() => setLanguageSelected(false)} className="mt-2 text-xs underline" style={{ color: '#FFCB05' }}>{t(locale, 'checklist.changeLanguage')}</button>
          {contract && (
            <div className="mt-3 p-3 rounded-xl grid grid-cols-2 gap-2 text-sm" style={{ backgroundColor: 'rgba(255,203,5,0.1)', border: '1px solid rgba(255,203,5,0.2)' }}>
              <div><span className="text-xs" style={{ color: '#FFCB05' }}>{t(locale, 'checklist.customer')}</span><p className="font-medium text-white">{contract.customerName}</p></div>
              <div><span className="text-xs" style={{ color: '#FFCB05' }}>{t(locale, 'checklist.vehicle')}</span><p className="font-medium text-white">{contract.vehicleModel}</p></div>
              <div><span className="text-xs" style={{ color: '#FFCB05' }}>{t(locale, 'checklist.plate')}</span><p className="font-medium text-white">{contract.vehiclePlate}</p></div>
              {contract.vehicleColor && <div><span className="text-xs" style={{ color: '#FFCB05' }}>{t(locale, 'checklist.color')}</span><p className="font-medium text-white">{contract.vehicleColor}</p></div>}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2"><span>!</span><span className="flex-1">{error}</span><button onClick={() => setError('')} className="font-bold text-red-400 ml-2">x</button></div>}

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <CarDiagram onSelect={openCamera} photoCounts={photoCounts} />
        </div>

        <div className="space-y-2">
          {checklist.map(item => {
            const count = photoCounts[item.key] || 0;
            const full = count >= MAX_PHOTOS;
            const isUploading = uploadingPhoto === item.key;
            const previews = localPreviews[item.key] || [];
            return (
              <div key={item.id} onClick={() => !full && openCamera(item.key)} className={'bg-white rounded-xl p-3 border-2 cursor-pointer transition-all active:scale-[0.98] ' + (full ? 'border-red-200 bg-red-50/60' : count > 0 ? 'border-green-300 bg-green-50/60' : 'border-gray-200 hover:border-yellow-300')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={'w-9 h-9 rounded-full flex items-center justify-center text-sm ' + (full ? 'bg-red-100' : count > 0 ? 'bg-green-100' : 'bg-gray-100')}>
                      {isUploading ? <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full" /> : full ? '\uD83D\uDD1D' : count > 0 ? '\u2713' : '\uD83D\uDCF7'}
                    </div>
                    <div><p className="font-semibold text-gray-800 text-sm">{getLabel(item)}</p><p className="text-xs text-gray-500">{count}/{MAX_PHOTOS} {t(locale, 'checklist.photosCount')}</p></div>
                  </div>
                  <div className={'px-2.5 py-1 rounded-full text-xs font-medium ' + (full ? 'bg-red-100 text-red-700' : isUploading ? 'bg-yellow-100 text-yellow-800' : count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500')}>
                    {full ? t(locale, 'checklist.full') : isUploading ? t(locale, 'checklist.uploadingShort') : count > 0 ? t(locale, 'checklist.add') : t(locale, 'checklist.take')}
                  </div>
                </div>
                {previews.length > 0 && (
                  <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                    {previews.map((src, i) => <img key={i} src={src} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-300" />)}
                    {!full && <div onClick={e => { e.stopPropagation(); openCamera(item.key); }} className="w-14 h-14 rounded-lg bg-yellow-50 border-2 border-dashed border-yellow-400 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-yellow-100"><span className="text-yellow-500 text-lg font-bold">+</span></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Complete inspection button - visible after at least 1 photo */}
        {totalPhotos > 0 && (
          <button onClick={handleSubmit} disabled={isSubmitting}
            className="w-full py-5 rounded-2xl text-white font-extrabold text-lg tracking-wide transition-all shadow-lg shadow-green-200 hover:shadow-xl active:scale-[0.98]"
            style={{ backgroundColor: isSubmitting ? '#9ca3af' : '#16a34a' }}>
            {isSubmitting
              ? <span className="flex items-center justify-center gap-2"><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />{t(locale, 'checklist.submitting')}</span>
              : <span>{t(locale, 'checklist.completeInspection')}<span className="block text-sm font-normal opacity-80 mt-0.5">{totalPhotos} {t(locale, 'checklist.photosReady')}</span></span>
            }
          </button>
        )}
        {totalPhotos === 0 && <p className="text-center text-xs text-gray-400">{t(locale, 'checklist.takeAtLeastOne')}</p>}
      </div>
      <div className="h-10" />
    </div>
  );

  /* ADMIN */
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f0' }}>
      <div className="fixed top-3 right-3 z-50">
        <select value={locale} onChange={e => setLocale(e.target.value as Locale)} className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white shadow-sm">
          {LOCALES.map(l => <option key={l.code} value={l.code}>{l.nativeName}</option>)}
        </select>
      </div>
      <div className="px-6 py-5" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg" style={{ backgroundColor: '#FFCB05', color: '#1a1a1a' }}>H</div>
          <div><h1 className="text-xl font-bold text-white tracking-wide">HERTZ MALTA</h1><p className="text-xs text-gray-400">{t(locale, 'admin.subtitle')}</p></div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: t(locale, 'admin.totalContracts'), value: contracts.length, bg: '#fff', bc: '#e5e5e5', c: '#1a1a1a' },
            { label: t(locale, 'admin.pending'), value: contracts.filter(c => c.status === 'pending').length, bg: '#fff', bc: '#e5e5e5', c: '#666' },
            { label: t(locale, 'admin.inProgress'), value: contracts.filter(c => c.status === 'in_progress').length, bg: '#FFCB05', bc: '#e6b800', c: '#1a1a1a' },
            { label: t(locale, 'admin.completed'), value: contracts.filter(c => c.status === 'completed').length, bg: '#22c55e', bc: '#16a34a', c: '#fff' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: s.bg, border: '1px solid ' + s.bc }}>
              <p className="text-2xl font-bold" style={{ color: s.c }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: s.c, opacity: 0.7 }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={() => setShowCreate(true)} className="text-sm font-medium px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#1a1a1a' }}>+ {t(locale, 'admin.newContract')}</button>
          <label className="cursor-pointer text-sm font-medium px-4 py-2 rounded-lg border bg-white flex items-center gap-2" style={{ borderColor: '#ccc', color: '#333' }}>
            {uploading ? t(locale, 'admin.processing') : t(locale, 'admin.bulkUpload')}
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} className="hidden" disabled={uploading} />
          </label>
          <button onClick={loadContracts} className="text-sm font-medium px-4 py-2 rounded-lg border bg-white" style={{ borderColor: '#ccc', color: '#333' }}>{t(locale, 'admin.refresh')}</button>
        </div>

        {/* SEARCH BAR AND FILTER */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Cerca per contratto, cliente, targa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              style={{ borderColor: '#ccc' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            style={{ borderColor: '#ccc' }}
          >
            <option value="all">Tutti gli stati</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {bulkResult && (
          <div className="bg-white rounded-xl p-4 border mb-6" style={{ borderColor: '#e5e5e5' }}>
            <h3 className="font-semibold text-gray-800 mb-2">{t(locale, 'admin.uploadSuccess')}</h3>
            <p className="text-sm text-gray-600">{bulkResult.summary.created} {t(locale, 'admin.created')}, {bulkResult.summary.skipped} {t(locale, 'admin.skipped')}, {bulkResult.summary.errors} {t(locale, 'admin.errors')}</p>
            <details className="mt-2"><summary className="text-xs text-gray-500 cursor-pointer">{t(locale, 'admin.results')}</summary>
              <div className="mt-2 max-h-40 overflow-y-auto text-xs space-y-1">
                {bulkResult.results?.map((r: any, i: number) => <div key={i} className={r.status === 'error' ? 'text-red-600' : r.status === 'skipped' ? 'text-yellow-600' : 'text-green-600'}>Row {r.row}: {r.contractNumber} - {r.customerName} [{r.status}]{r.error && ' - ' + r.error}</div>)}
              </div>
            </details>
            <button onClick={() => setBulkResult(null)} className="mt-2 text-xs text-gray-400">Chiudi</button>
          </div>
        )}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4" onClick={() => setShowCreate(false)}>
            <form onSubmit={handleCreateContract} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="font-semibold text-gray-800 mb-1 text-lg">{t(locale, 'admin.newContractTitle')}</h2>
              <p className="text-xs text-gray-500 mb-4">{t(locale, 'admin.newContractDesc')}</p>
              <div className="space-y-3">
                {[{ key: 'contractNumber', label: t(locale, 'admin.contractNumber'), required: true },{ key: 'customerName', label: t(locale, 'admin.customerName'), required: true },{ key: 'vehiclePlate', label: t(locale, 'admin.vehiclePlate') },{ key: 'vehicleModel', label: t(locale, 'admin.vehicleModel') },{ key: 'customerEmail', label: t(locale, 'admin.customerEmail') },{ key: 'customerPhone', label: t(locale, 'admin.customerPhone') },{ key: 'vehicleColor', label: t(locale, 'admin.vehicleColor') }].map(f => (
                  <div key={f.key}><label className="block text-xs font-medium text-gray-600 mb-1">{f.label}{f.required && '*'}</label><input type="text" value={(createForm as any)[f.key]} onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required={f.required} /></div>
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                <button type="submit" className="flex-1 text-white py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#1a1a1a' }}>{t(locale, 'admin.createAndGenerate')}</button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        )}
        {(generatedToken || tokenDialog) && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4" onClick={() => { setGeneratedToken(null); setTokenDialog(null); }}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full">
              {generatedToken ? (<>
                <h2 className="font-semibold text-gray-800 mb-1 text-lg">{t(locale, 'admin.linkGenerated')}</h2>
                <div className="rounded-xl p-3 break-all text-sm font-mono mb-4" style={{ backgroundColor: '#f5f5f0' }}>{window.location.origin}{generatedToken.link}</div>
                <div className="flex gap-2">
                  <button onClick={() => copyToClip(window.location.origin + generatedToken.link, 'dialog')} className="flex-1 text-white py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#1a1a1a' }}>{copied === 'dialog' ? 'Copiato!' : t(locale, 'admin.copyLink')}</button>
                  <button onClick={() => { setGeneratedToken(null); setTokenDialog(null); }} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm">Chiudi</button>
                </div>
              </>) : tokenDialog ? (<>
                <h2 className="font-semibold text-gray-800 mb-4">{t(locale, 'admin.generateToken')}</h2>
                <p className="text-sm text-gray-600 mb-4">Contratto: <strong>{tokenDialog.contractNumber}</strong></p>
                <button onClick={() => handleGenerateToken(tokenDialog.contractId)} className="w-full text-white py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#1a1a1a' }}>{t(locale, 'admin.generate')}</button>
              </>) : null}
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: '#e5e5e5', backgroundColor: '#fafaf5' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">{t(locale, 'admin.contracts')}</h2>
              {(searchQuery || statusFilter !== 'all') && (
                <span className="text-xs text-gray-500">{filteredContracts().length} di {contracts.length} contratti</span>
              )}
            </div>
          </div>
          {filteredContracts().length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {contracts.length === 0 ? t(locale, 'admin.noContracts') : 'Nessun contratto trovato per la ricerca'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr style={{ backgroundColor: '#1a1a1a' }}>{['Contract','Client','Vehicle','Status','Photos','Tokens','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y" style={{ borderColor: '#f0f0f0' }}>
                  {filteredContracts().map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{c.contractNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600"><div>{c.customerName}</div>{c.customerEmail && <div className="text-xs text-gray-400">{c.customerEmail}</div>}</td>
                      <td className="px-4 py-3 text-sm text-gray-600"><div>{c.vehicleModel}</div><div className="text-xs text-gray-400">{c.vehiclePlate}</div></td>
                      <td className="px-4 py-3"><span className={'inline-flex px-2 py-0.5 rounded-full text-xs font-medium ' + statusBadge(c.status)}>{c.status}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.photosSubmitted}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1.5">
                          {c.tokens.map(tk => {
                            const link = window.location.origin + '/#token=' + tk.token;
                            return (<div key={tk.id} className="flex items-center gap-1.5">
                              <span className={'w-1.5 h-1.5 rounded-full ' + (tk.usedAt ? 'bg-gray-300' : tk.isExpired ? 'bg-red-400' : 'bg-green-400')} />
                              <span className="text-xs text-gray-500">{tk.usedAt ? 'Usato' : tk.isExpired ? 'Scaduto' : 'Attivo'}</span>
                              <button onClick={() => copyToClip(link, tk.id)} className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: copied === tk.id ? '#22c55e' : '#FFCB05', color: copied === tk.id ? '#fff' : '#1a1a1a' }}>{copied === tk.id ? 'OK' : 'Copia'}</button>
                            </div>);
                          })}
                          {c.tokens.length === 0 && <span className="text-xs text-gray-400">Nessun token</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3"><button onClick={() => { setTokenDialog({ contractId: c.id, contractNumber: c.contractNumber }); setGeneratedToken(null); }} className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: '#1a1a1a', color: '#FFCB05' }}>+ Token</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
