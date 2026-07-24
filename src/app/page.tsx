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
function LanguageSelector({ locale, setLocale, dark = false }: { locale: Locale; setLocale: (l: Locale) => void; dark?: boolean }) {
const [open, setOpen] = useState(false);
const currentLocale = LOCALES.find(l => l.code === locale) || LOCALES[0];
return (
 <div className="relative">
 <button
onClick={() => setOpen(!open)}
className={'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ' + (dark ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50')}
 >
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
{currentLocale.nativeName}
 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
 </button>
{open && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
 <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 min-w-[160px] max-h-[300px] overflow-y-auto">
{LOCALES.map(l => (
 <button
key={l.code}
onClick={() => { setLocale(l.code); setOpen(false); }}
className={'w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ' + (l.code === locale ? 'font-semibold text-yellow-700 bg-yellow-50' : 'text-gray-700')}
 >
 <span className="mr-2">{l.code.toUpperCase()}</span>
{l.nativeName}
 </button>
))}
 </div>
 </>
)}
 </div>
);
}
export default function Home() {
const [locale, setLocale] = useState<Locale>('it');
// Admin panel is always in English — no language switch needed there.
const adminLocale: Locale = 'en';
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
// DELETE STATES
const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
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
if (count >= MAX_PHOTOS) { setError('Massimo ' + MAX_PHOTOS + ' foto per questo angolo.'); return; }
const item = checklist.find(c => c.key === key);
if (!item) return;
setActiveKey(key); setError('');
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
const objectUrl = URL.createObjectURL(file);
objectUrlsRef.current.push(objectUrl);
setLocalPreviews(p => ({ ...p, [activeKey!]: [...(p[activeKey!] || []), objectUrl] }));
setPhotoCounts(p => ({ ...p, [activeKey!]: (p[activeKey!] || 0) + 1 }));
setChecklist(p => p.map(c => c.key === activeKey ? { ...c, completed: true, photoCount: c.photoCount + 1 } : c));
} catch (err: unknown) { setError(err instanceof Error ? err.message : 'Upload failed'); }
finally { setUploadingPhoto(null); }
}
if (fileInputRef.current) fileInputRef.current.value = '';
};
const totalPhotos = Object.values(photoCounts).reduce((s, c) => s + c, 0);
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
// DELETE FUNCTIONS
const handleDeleteContract = async (id: string) => {
try {
const r = await fetch('/api/admin/contracts?id=' + id, { method: 'DELETE' });
if (!r.ok) {
const errData = await r.json().catch(() => ({}));
throw new Error(errData.error || 'Delete failed');
}
setDeleteConfirm(null);
setSelectedContracts(prev => { const next = new Set(prev); next.delete(id); return next; });
loadContracts();
} catch (err: unknown) { alert(err instanceof Error ? err.message : 'Failed to delete'); }
};
const handleDeleteSelected = async () => {
if (selectedContracts.size === 0) return;
const ids = Array.from(selectedContracts);
try {
for (const id of ids) {
const r = await fetch('/api/admin/contracts?id=' + id, { method: 'DELETE' });
if (!r.ok) {
const errData = await r.json().catch(() => ({}));
throw new Error(errData.error || `Delete failed for ${id}`);
}
}
setSelectedContracts(new Set());
setDeleteAllConfirm(false);
loadContracts();
} catch (err: unknown) { alert(err instanceof Error ? err.message : 'Failed to delete'); }
};
const toggleSelectAll = () => {
const filtered = filteredContracts();
if (selectedContracts.size === filtered.length && filtered.length > 0) setSelectedContracts(new Set());
else setSelectedContracts(new Set(filtered.map(c => c.id)));
};
const toggleSelect = (id: string) => {
setSelectedContracts(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
};
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
 <div className="mt-8 p-4 bg-gray-50 rounded-xl"> <p className="text-gray-500 text-xs">{t(locale, 'confirm.thanks')}</p> </div>
 </div>
 </div>
);
/* CUSTOMER */
if (mode === 'customer') return (
 <div className="min-h-screen bg-gray-50">
 <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
  <div style={{ backgroundColor: '#1a1a1a' }}>
     <div className="max-w-lg mx-auto px-4 py-4">
       <div className="flex items-center justify-between">
         <div><h1 className="text-lg font-bold text-white">HERTZ MALTA</h1><p className="text-xs" style={{ color: '#FFCB05' }}>{t(locale, 'app.title')}</p></div>
         <div className="flex items-center gap-2">
           <LanguageSelector locale={locale} setLocale={setLocale} dark />
           {contract && <div className="text-right"><p className="text-xs text-gray-400">{t(locale, 'confirm.contract')}</p><p className="text-sm font-semibold text-white">{contract.contractNumber}</p></div>}
         </div>
       </div>
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
         // Use translated label if available, fallback to label from DB
         const translatedLabel = t(locale, 'photo.' + item.key) !== 'photo.' + item.key ? t(locale, 'photo.' + item.key) : item.label;
         return (
           <div key={item.id} onClick={() => !full && openCamera(item.key)} className={'bg-white rounded-xl p-3 border-2 cursor-pointer transition-all active:scale-[0.98] ' + (full ? 'border-red-200 bg-red-50/60' : count > 0 ? 'border-green-300 bg-green-50/60' : 'border-gray-200 hover:border-yellow-300')}>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className={'w-9 h-9 rounded-full flex items-center justify-center text-sm ' + (full ? 'bg-red-100' : count > 0 ? 'bg-green-100' : 'bg-gray-100')}>
                   {isUploading ? <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full" /> : full ? '🔝' : count > 0 ? '✓' : '📷'}
                 </div>
                 <div><p className="font-semibold text-gray-800 text-sm">{translatedLabel}</p><p className="text-xs text-gray-500">{count}/{MAX_PHOTOS} foto</p></div>
               </div>
               <div className={'px-2.5 py-1 rounded-full text-xs font-medium ' + (full ? 'bg-red-100 text-red-700' : isUploading ? 'bg-yellow-100 text-yellow-800' : count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500')}>
                 {full ? t(locale, 'checklist.retake') : isUploading ? t(locale, 'checklist.uploading') : count > 0 ? t(locale, 'checklist.retake') : t(locale, 'checklist.takePhoto')}
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
     {totalPhotos > 0 && (
       <button onClick={handleSubmit} disabled={isSubmitting}
         className="w-full py-5 rounded-2xl text-white font-extrabold text-lg tracking-wide transition-all shadow-lg shadow-green-200 hover:shadow-xl active:scale-[0.98]"
         style={{ backgroundColor: isSubmitting ? '#9ca3af' : '#16a34a' }}>
         {isSubmitting
           ? <span className="flex items-center justify-center gap-2"><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />{t(locale, 'checklist.submitting')}</span>
           : <span>{t(locale, 'checklist.submitCheckin')}<span className="block text-sm font-normal opacity-80 mt-0.5">{totalPhotos} foto pronte</span></span>
         }
       </button>
     )}
     {totalPhotos === 0 && <p className="text-center text-xs text-gray-400">{t(locale, 'checklist.completeAll')}</p>}
   </div>
   <div className="h-10" />
 </div>
);
/* ADMIN */
return (
 <div className="min-h-screen" style={{ backgroundColor: '#f5f5f0' }}>
 <div className="px-6 py-5" style={{ backgroundColor: '#1a1a1a' }}>
 <div className="max-w-6xl mx-auto flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg" style={{ backgroundColor: '#FFCB05', color: '#1a1a1a' }}>H</div>
 <div> <h1 className="text-xl font-bold text-white tracking-wide">HERTZ MALTA</h1> <p className="text-xs text-gray-400">{t(adminLocale, 'admin.subtitle')}</p> </div>
 </div>
 </div>
 <div className="max-w-6xl mx-auto px-4 py-6">
 <div className="grid grid-cols-4 gap-3 mb-6">
{[
{ label: t(adminLocale, 'admin.totalContracts'), value: contracts.length, bg: '#fff', bc: '#e5e5e5', c: '#1a1a1a' },
{ label: t(adminLocale, 'admin.pending'), value: contracts.filter(c => c.status === 'pending').length, bg: '#fff', bc: '#e5e5e5', c: '#666' },
{ label: t(adminLocale, 'admin.inProgress'), value: contracts.filter(c => c.status === 'in_progress').length, bg: '#FFCB05', bc: '#e6b800', c: '#1a1a1a' },
{ label: t(adminLocale, 'admin.completed'), value: contracts.filter(c => c.status === 'completed').length, bg: '#22c55e', bc: '#16a34a', c: '#fff' },
].map(s => (
 <div key={s.label} className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: s.bg, border: '1px solid ' + s.bc }}>
 <p className="text-2xl font-bold" style={{ color: s.c }}>{s.value}</p>
 <p className="text-xs mt-1" style={{ color: s.c, opacity: 0.7 }}>{s.label}</p>
 </div>
))}
 </div>
 <div className="flex flex-wrap gap-3 mb-6">
 <button onClick={() => setShowCreate(true)} className="text-sm font-medium px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#1a1a1a' }}>+ {t(adminLocale, 'admin.newContract')}</button>
 <label className="cursor-pointer text-sm font-medium px-4 py-2 rounded-lg border bg-white flex items-center gap-2" style={{ borderColor: '#ccc', color: '#333' }}>
{uploading ? t(adminLocale, 'admin.processing') : t(adminLocale, 'admin.bulkUpload')}
 <input type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} className="hidden" disabled={uploading} />
 </label>
 <button onClick={loadContracts} className="text-sm font-medium px-4 py-2 rounded-lg border bg-white" style={{ borderColor: '#ccc', color: '#333' }}>{t(adminLocale, 'admin.refresh')}</button>
 {selectedContracts.size > 0 && (
 <button onClick={() => setDeleteAllConfirm(true)} className="text-sm font-medium px-4 py-2 rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-700 ml-auto">
 {t(adminLocale, 'admin.deleteSelected')} ({selectedContracts.size})
 </button>
 )}
 </div>
    {/* SEARCH BAR AND FILTER */}
     <div className="flex flex-col sm:flex-row gap-3 mb-6">
       <div className="relative flex-1">
         <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
         <input
           type="text"
           placeholder={t(adminLocale, 'admin.searchPlaceholder')}
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
         <option value="all">{t(adminLocale, 'admin.allStatuses')}</option>
         <option value="pending">Pending</option>
         <option value="in_progress">In Progress</option>
         <option value="completed">Completed</option>
       </select>
     </div>
     {bulkResult && (
       <div className="bg-white rounded-xl p-4 border mb-6" style={{ borderColor: '#e5e5e5' }}>
         <h3 className="font-semibold text-gray-800 mb-2">{t(adminLocale, 'admin.uploadSuccess')}</h3>
         <p className="text-sm text-gray-600">{bulkResult.summary.created} {t(adminLocale, 'admin.created')}, {bulkResult.summary.skipped} {t(adminLocale, 'admin.skipped')}, {bulkResult.summary.errors} {t(adminLocale, 'admin.errors')}</p>
         <details className="mt-2"><summary className="text-xs text-gray-500 cursor-pointer">{t(adminLocale, 'admin.results')}</summary>
           <div className="mt-2 max-h-40 overflow-y-auto text-xs space-y-1">
             {bulkResult.results?.map((r: any, i: number) => <div key={i} className={r.status === 'error' ? 'text-red-600' : r.status === 'skipped' ? 'text-yellow-600' : 'text-green-600'}>Row {r.row}: {r.contractNumber} - {r.customerName} [{r.status}]{r.error && ' - ' + r.error}</div>)}
           </div>
         </details>
         <button onClick={() => setBulkResult(null)} className="mt-2 text-xs text-gray-400">{t(adminLocale, 'admin.close')}</button>
       </div>
     )}
     {showCreate && (
       <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4" onClick={() => setShowCreate(false)}>
         <form onSubmit={handleCreateContract} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
           <div className="px-6 py-5 flex items-start justify-between" style={{ backgroundColor: '#1a1a1a' }}>
             <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-base flex-shrink-0" style={{ backgroundColor: '#FFCB05', color: '#1a1a1a' }}>+</div>
               <div>
                 <h2 className="font-semibold text-white text-base">{t(adminLocale, 'admin.newContractTitle')}</h2>
                 <p className="text-xs mt-0.5" style={{ color: '#FFCB05' }}>{t(adminLocale, 'admin.newContractDesc')}</p>
               </div>
             </div>
             <button type="button" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white flex-shrink-0 ml-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
           </div>
           <div className="px-6 py-5 overflow-y-auto space-y-5">
             <div>
               <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#e6b800' }}>{t(adminLocale, 'admin.contractDetails')}</p>
               <div className="space-y-3">
                 {[{ key: 'contractNumber', label: t(adminLocale, 'admin.contractNumber'), required: true },{ key: 'customerName', label: t(adminLocale, 'admin.customerName'), required: true }].map(f => (
                   <div key={f.key}>
                     <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}{f.required && <span style={{ color: '#e6b800' }}> *</span>}</label>
                     <input type="text" value={(createForm as any)[f.key]} onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent" required={f.required} />
                   </div>
                 ))}
               </div>
             </div>
             <div>
               <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-gray-400">{t(adminLocale, 'admin.optionalDetails')}</p>
               <div className="grid grid-cols-2 gap-3">
                 {[{ key: 'vehiclePlate', label: t(adminLocale, 'admin.vehiclePlate') },{ key: 'vehicleModel', label: t(adminLocale, 'admin.vehicleModel') },{ key: 'vehicleColor', label: t(adminLocale, 'admin.vehicleColor') },{ key: 'customerEmail', label: t(adminLocale, 'admin.customerEmail') },{ key: 'customerPhone', label: t(adminLocale, 'admin.customerPhone') }].map(f => (
                   <div key={f.key} className={f.key === 'customerEmail' ? 'col-span-2' : ''}>
                     <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                     <input type="text" value={(createForm as any)[f.key]} onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent" />
                   </div>
                 ))}
               </div>
             </div>
           </div>
           <div className="flex gap-2 px-6 py-4 border-t" style={{ borderColor: '#e5e5e5', backgroundColor: '#fafaf5' }}>
             <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 bg-white border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50" style={{ borderColor: '#ccc' }}>{t(adminLocale, 'admin.cancel')}</button>
             <button type="submit" className="flex-1 text-sm font-medium py-2.5 rounded-lg" style={{ backgroundColor: '#FFCB05', color: '#1a1a1a' }}>{t(adminLocale, 'admin.createAndGenerate')}</button>
           </div>
         </form>
       </div>
     )}
     {(generatedToken || tokenDialog) && (
       <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4" onClick={() => { setGeneratedToken(null); setTokenDialog(null); }}>
         <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full">
           {generatedToken ? (<>
             <h2 className="font-semibold text-gray-800 mb-1 text-lg">{t(adminLocale, 'admin.linkGenerated')}</h2>
             <div className="rounded-xl p-3 break-all text-sm font-mono mb-4" style={{ backgroundColor: '#f5f5f0' }}>{window.location.origin}{generatedToken.link}</div>
             <div className="flex gap-2">
               <button onClick={() => copyToClip(window.location.origin + generatedToken.link, 'dialog')} className="flex-1 text-white py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#1a1a1a' }}>{copied === 'dialog' ? t(adminLocale, 'admin.copied') : t(adminLocale, 'admin.copyLink')}</button>
               <button onClick={() => { setGeneratedToken(null); setTokenDialog(null); }} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm">{t(adminLocale, 'admin.close')}</button>
             </div>
           </>) : tokenDialog ? (<>
             <h2 className="font-semibold text-gray-800 mb-4">{t(adminLocale, 'admin.generateToken')}</h2>
             <p className="text-sm text-gray-600 mb-4">{t(adminLocale, 'admin.contractLabel')} <strong>{tokenDialog.contractNumber}</strong></p>
             <button onClick={() => handleGenerateToken(tokenDialog.contractId)} className="w-full text-white py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#1a1a1a' }}>{t(adminLocale, 'admin.generate')}</button>
           </>) : null}
         </div>
       </div>
     )}
     <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
       <div className="px-6 py-4 border-b" style={{ borderColor: '#e5e5e5', backgroundColor: '#fafaf5' }}>
         <div className="flex items-center justify-between">
           <h2 className="font-semibold text-gray-800">{t(adminLocale, 'admin.contracts')}</h2>
           {(searchQuery || statusFilter !== 'all') && (
             <span className="text-xs text-gray-500">{filteredContracts().length} {t(adminLocale, 'admin.of')} {contracts.length} {t(adminLocale, 'admin.contractsFound')}</span>
           )}
         </div>
       </div>
       {filteredContracts().length === 0 ? (
         <div className="p-8 text-center text-gray-400">
           {contracts.length === 0 ? t(adminLocale, 'admin.noContracts') : t(adminLocale, 'admin.noSearchResults')}
         </div>
       ) : (
         <div className="overflow-x-auto">
           <table className="w-full">
             <thead><tr style={{ backgroundColor: '#1a1a1a' }}>
               <th className="px-4 py-3 w-10">
                 <input type="checkbox" checked={selectedContracts.size === filteredContracts().length && filteredContracts().length > 0} onChange={toggleSelectAll} className="rounded border-gray-300" />
               </th>
               {['Contract','Client','Vehicle','Status','Photos','Tokens','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{h}</th>)}
             </tr></thead>
             <tbody className="divide-y" style={{ borderColor: '#f0f0f0' }}>
               {filteredContracts().map(c => (
                 <tr key={c.id} className="hover:bg-gray-50">
                   <td className="px-4 py-3">
                     <input type="checkbox" checked={selectedContracts.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded border-gray-300" />
                   </td>
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
                           <span className="text-xs text-gray-500">{tk.usedAt ? t(adminLocale, 'admin.tokenUsed') : tk.isExpired ? t(adminLocale, 'admin.tokenExpired') : t(adminLocale, 'admin.tokenActive')}</span>
                           <button onClick={() => copyToClip(link, tk.id)} className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: copied === tk.id ? '#22c55e' : '#FFCB05', color: copied === tk.id ? '#fff' : '#1a1a1a' }}>{copied === tk.id ? 'OK' : t(adminLocale, 'admin.copy')}</button>
                         </div>);
                       })}
                       {c.tokens.length === 0 && <span className="text-xs text-gray-400">{t(adminLocale, 'admin.noTokens')}</span>}
                     </div>
                   </td>
                   <td className="px-4 py-3">
                     <div className="flex items-center gap-1.5">
                       <button onClick={() => { setTokenDialog({ contractId: c.id, contractNumber: c.contractNumber }); setGeneratedToken(null); }} className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: '#1a1a1a', color: '#FFCB05' }}>+ Token</button>
                       {deleteConfirm === c.id ? (
                         <div className="flex items-center gap-1">
                           <button onClick={() => handleDeleteContract(c.id)} className="text-xs font-medium px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700">{t(adminLocale, 'admin.yes')}</button>
                           <button onClick={() => setDeleteConfirm(null)} className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">{t(adminLocale, 'admin.no')}</button>
                         </div>
                       ) : (
                         <button onClick={() => setDeleteConfirm(c.id)} className="text-xs font-medium px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200">{t(adminLocale, 'admin.delete')}</button>
                       )}
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       )}
     </div>
     {deleteAllConfirm && (
       <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDeleteAllConfirm(false)}>
         <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
               <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
             </div>
             <div>
               <h3 className="font-semibold text-gray-800 text-lg">{t(adminLocale, 'admin.deleteConfirmTitle')}</h3>
               <p className="text-sm text-gray-500">{selectedContracts.size} {t(adminLocale, 'admin.contractsFound')}</p>
             </div>
           </div>
           <p className="text-sm text-gray-600 mb-6">{t(adminLocale, 'admin.deleteConfirmMsg')}</p>
           <div className="flex gap-3">
             <button onClick={handleDeleteSelected} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700">{t(adminLocale, 'admin.deleteSelected')}</button>
             <button onClick={() => setDeleteAllConfirm(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200">{t(adminLocale, 'admin.close')}</button>
           </div>
         </div>
       </div>
     )}
   </div>
 </div>
);
}
