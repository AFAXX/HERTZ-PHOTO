'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CarFront, ArrowRight, ArrowLeft, Car, Armchair, Camera, Video, Upload,
  CheckCircle2, XCircle, Clock, Copy, Trash2, Edit3, Plus, FileUp,
  Search, ChevronRight, Globe, Play, Loader2, AlertCircle, Shield,
  Send, RefreshCw, Eye, X, Link, QrCode, Download, Info
} from 'lucide-react';
import { t, LOCALES, type Locale, RTL_LOCALES, getPhotoLabel } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

// Types
interface RentalContract {
  id: string;
  contractNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleColor?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  tokens?: AccessToken[];
  media?: MediaSubmission[];
}

interface AccessToken {
  id: string;
  token: string;
  contractId: string;
  expiresAt: string;
  usedAt?: string | null;
  createdAt: string;
}

interface PhotoRequirement {
  id: string;
  key: string;
  label: string;
  labelEn?: string | null;
  description?: string | null;
  orderIndex: number;
  required: boolean;
  icon?: string | null;
  allowVideo: boolean;
  submissions?: MediaSubmission[];
  completed?: boolean;
  photoCount?: number;
  videoCount?: number;
}

interface MediaSubmission {
  id: string;
  contractId: string;
  requirementId: string;
  mediaType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number | null;
  localPath?: string | null;
  graphItemId?: string | null;
  graphDriveId?: string | null;
  uploadedAt: string;
  requirement?: PhotoRequirement;
}

type AppMode = 'admin' | 'customer' | 'completed';

const ICON_MAP: Record<string, React.ReactNode> = {
  CarFront: <CarFront className="w-5 h-5" />,
  ArrowRight: <ArrowRight className="w-5 h-5" />,
  ArrowLeft: <ArrowLeft className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  Armchair: <Armchair className="w-5 h-5" />,
};

export default function HomePage() {
  // Core state
  const [mode, setMode] = useState<AppMode>('admin');
  const [locale, setLocale] = useState<Locale>('en');
  const [tokenValue, setTokenValue] = useState('');
  const [loading, setLoading] = useState(true);

  // Admin state
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewContract, setShowNewContract] = useState(false);
  const [showEditContract, setShowEditContract] = useState(false);
  const [editingContract, setEditingContract] = useState<RentalContract | null>(null);
  const [newContract, setNewContract] = useState({
    contractNumber: '', customerName: '', customerEmail: '', customerPhone: '',
    vehiclePlate: '', vehicleModel: '', vehicleColor: ''
  });
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);

  // Customer state
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [accessToken, setAccessToken] = useState<AccessToken | null>(null);
  const [checklist, setChecklist] = useState<PhotoRequirement[]>([]);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenErrorCode, setTokenErrorCode] = useState<string | null>(null);
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const [mediaModes, setMediaModes] = useState<Record<string, 'photo' | 'video'>>({});
  const [showLanguageSelect, setShowLanguageSelect] = useState(true);
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Detect mode from URL hash
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#token=')) {
        const tk = hash.replace('#token=', '');
        setTokenValue(tk);
        setMode('customer');
        setShowLanguageSelect(true);
      } else {
        setMode('admin');
      }
      setLoading(false);
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const loadContracts = async () => {
    try {
      const res = await fetch('/api/admin/contracts');
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts || []);
      }
    } catch (err) {
      toast.error('Failed to load contracts');
    }
  };

  const validateToken = async () => {
    try {
      const res = await fetch('/api/token/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTokenError(data.error);
        setTokenErrorCode(data.code);
        if (data.contract) setContract(data.contract);
        return;
      }
      setContract(data.contract);
      setAccessToken(data.token);
      setChecklist(data.checklist || []);
      setTokenError(null);
      setTokenErrorCode(null);
      // Init media modes
      const modes: Record<string, 'photo' | 'video'> = {};
      (data.checklist || []).forEach((r: PhotoRequirement) => { modes[r.id] = 'photo'; });
      setMediaModes(modes);
    } catch (err) {
      setTokenError(t('landing.connectionError', locale));
      setTokenErrorCode('connection');
    }
  };

  // Load admin data
  useEffect(() => {
    if (mode === 'admin') {
      fetch('/api/admin/contracts')
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setContracts(data.contracts || []); })
        .catch(() => { toast.error('Failed to load contracts'); });
    }
  }, [mode]);

  // Validate customer token
  useEffect(() => {
    if (mode === 'customer' && tokenValue) {
      (async () => {
        try {
          const res = await fetch('/api/token/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenValue }),
          });
          const data = await res.json();
          if (!res.ok) {
            setTokenError(data.error);
            setTokenErrorCode(data.code);
            if (data.contract) setContract(data.contract);
            return;
          }
          setContract(data.contract);
          setAccessToken(data.token);
          setChecklist(data.checklist || []);
          setTokenError(null);
          setTokenErrorCode(null);
          const modes: Record<string, 'photo' | 'video'> = {};
          (data.checklist || []).forEach((r: PhotoRequirement) => { modes[r.id] = 'photo'; });
          setMediaModes(modes);
        } catch {
          setTokenError(t('landing.connectionError', locale));
          setTokenErrorCode('connection');
        }
      })();
    }
  }, [mode, tokenValue]);

  const loadChecklist = async () => {
    if (!tokenValue) return;
    try {
      const res = await fetch('/api/token/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setChecklist(data.checklist || []);
        setContract(data.contract);
      }
    } catch (err) { /* ignore */ }
  };

  // Admin CRUD operations
  const createContract = async () => {
    try {
      const res = await fetch('/api/admin/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContract),
      });
      if (res.ok) {
        toast.success('Contract created successfully');
        setShowNewContract(false);
        setNewContract({ contractNumber: '', customerName: '', customerEmail: '', customerPhone: '', vehiclePlate: '', vehicleModel: '', vehicleColor: '' });
        loadContracts();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create contract');
      }
    } catch (err) {
      toast.error('Failed to create contract');
    }
  };

  const updateContract = async () => {
    if (!editingContract) return;
    try {
      const res = await fetch('/api/admin/contracts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingContract),
      });
      if (res.ok) {
        toast.success('Contract updated');
        setShowEditContract(false);
        setEditingContract(null);
        loadContracts();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update');
      }
    } catch (err) {
      toast.error('Failed to update contract');
    }
  };

  const deleteContract = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/contracts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Contract deleted');
        loadContracts();
      } else {
        toast.error('Failed to delete contract');
      }
    } catch (err) {
      toast.error('Failed to delete contract');
    }
  };

  const generateToken = async (contractId: string) => {
    try {
      const res = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Token generated');
        loadContracts();
        return data.token;
      } else {
        toast.error('Failed to generate token');
      }
    } catch (err) {
      toast.error('Failed to generate token');
    }
    return null;
  };

  const copyTokenLink = (token: string) => {
    const link = `${window.location.origin}${window.location.pathname}#token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success(t('admin.copied', locale));
  };

  const seedRequirements = async () => {
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      if (res.ok) {
        toast.success('Photo requirements seeded');
      } else {
        toast.error('Failed to seed requirements');
      }
    } catch (err) {
      toast.error('Failed to seed requirements');
    }
  };

  const bulkUpload = async (file: File) => {
    setBulkUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/bulk-upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Created ${data.created} contracts`);
        if (data.errors?.length) toast.warning(`${data.errors.length} rows skipped`);
        setShowBulkUpload(false);
        loadContracts();
      } else {
        toast.error(data.error || 'Bulk upload failed');
      }
    } catch (err) {
      toast.error('Bulk upload failed');
    }
    setBulkUploading(false);
  };

  // Customer upload
  const uploadMedia = async (requirementId: string, file: File, mediaType: 'photo' | 'video', duration?: number) => {
    setUploadingItem(requirementId);
    try {
      const formData = new FormData();
      formData.append('token', tokenValue);
      formData.append('media', file);
      formData.append('requirementId', requirementId);
      formData.append('mediaType', mediaType);
      if (duration) formData.append('duration', String(duration));

      const res = await fetch('/api/photos/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        toast.success(t('checklist.uploadSuccess', locale));
        loadChecklist();
      } else {
        toast.error(data.error || t('checklist.uploadError', locale));
      }
    } catch (err) {
      toast.error(t('checklist.uploadError', locale));
    }
    setUploadingItem(null);
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setMode('completed');
        setContract(data.contract);
      } else {
        if (data.code === 'incomplete') {
          toast.error(data.error);
        } else {
          toast.error(data.error || 'Failed to submit');
        }
      }
    } catch (err) {
      toast.error('Failed to submit');
    }
  };

  // Filter contracts
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = !searchTerm ||
      c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: contracts.length,
    pending: contracts.filter(c => c.status === 'pending').length,
    inProgress: contracts.filter(c => c.status === 'in_progress').length,
    completed: contracts.filter(c => c.status === 'completed').length,
  };

  const allRequiredCompleted = checklist
    .filter(r => r.required)
    .every(r => (r.submissions?.length || 0) > 0);

  const isRTL = RTL_LOCALES.includes(locale);

  // Get requirement icon
  const getReqIcon = (iconName?: string | null) => {
    if (!iconName) return <Camera className="w-5 h-5" />;
    return ICON_MAP[iconName] || <Camera className="w-5 h-5" />;
  };

  // Get requirement label
  const getReqLabel = (req: PhotoRequirement) => {
    if (locale === 'en') return req.labelEn || req.label;
    return getPhotoLabel(req.key, locale);
  };

  // Get total media for a requirement
  const getTotalMedia = (req: PhotoRequirement) => {
    return (req.submissions?.length || 0);
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" />
      </div>
    );
  }

  // ==================== COMPLETED SCREEN ====================
  if (mode === 'completed') {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#252525] flex flex-col items-center justify-center p-6 ${isRTL ? 'rtl' : ''}`}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.5 }}>
          <div className="w-20 h-20 rounded-full bg-[#FFCC00] flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#1a1a1a]" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-3xl font-bold text-[#FFCC00] mb-2">{t('completed.title', locale)}</h1>
          <p className="text-gray-300 text-center mb-4">{t('completed.subtitle', locale)}</p>
          {contract && (
            <Card className="hertz-card max-w-md w-full mb-6">
              <CardContent className="p-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('completed.contractNumber', locale)}</span>
                  <span className="text-[#FFCC00] font-semibold">{contract.contractNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('admin.customerName', locale)}</span>
                  <span className="text-white">{contract.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('admin.vehiclePlate', locale)}</span>
                  <span className="text-white">{contract.vehiclePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('admin.vehicleModel', locale)}</span>
                  <span className="text-white">{contract.vehicleModel}</span>
                </div>
                {contract.vehicleColor && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('admin.vehicleColor', locale)}</span>
                    <span className="text-white">{contract.vehicleColor}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <p className="text-gray-300 text-center">{t('completed.thankYou', locale)}</p>
        </motion.div>
      </div>
    );
  }

  // ==================== CUSTOMER CHECK-IN ====================
  if (mode === 'customer') {
    // Language selection screen
    if (showLanguageSelect && !tokenError) {
      return (
        <div className={`min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#252525] flex flex-col items-center justify-center p-6 ${isRTL ? 'rtl' : ''}`}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 rounded-full bg-[#FFCC00] flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-[#1a1a1a]" />
            </div>
            <h1 className="text-2xl font-bold text-[#FFCC00] mb-2 text-center">{t('landing.title', locale)}</h1>
            <p className="text-gray-300 text-center mb-6">{t('landing.selectLanguage', locale)}</p>

            <div className="max-w-md w-full grid grid-cols-2 gap-2 mb-6">
              {Object.entries(LOCALES).map(([code, name]) => (
                <Button
                  key={code}
                  variant={locale === code ? 'default' : 'outline'}
                  className={locale === code
                    ? 'hertz-btn-gold text-sm'
                    : 'border-gray-600 text-gray-300 hover:border-[#FFCC00] hover:text-[#FFCC00] text-sm'
                  }
                  onClick={() => setLocale(code as Locale)}
                >
                  {name}
                </Button>
              ))}
            </div>

            <Button
              className="hertz-btn-gold w-full max-w-md text-lg py-3"
              onClick={() => setShowLanguageSelect(false)}
            >
              {t('landing.startCheckin', locale)}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      );
    }

    // Error screens
    if (tokenError) {
      return (
        <div className={`min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#252525] flex flex-col items-center justify-center p-6 ${isRTL ? 'rtl' : ''}`}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              {tokenErrorCode === 'expired' ? <Clock className="w-8 h-8 text-red-400" /> :
               tokenErrorCode === 'used' ? <CheckCircle2 className="w-8 h-8 text-green-400" /> :
               <AlertCircle className="w-8 h-8 text-red-400" />}
            </div>
            <h1 className="text-2xl font-bold mb-2 text-center">
              {tokenErrorCode === 'expired' ? t('landing.expired', locale) :
               tokenErrorCode === 'used' ? t('landing.used', locale) :
               t('landing.connectionError', locale)}
            </h1>
            {contract && (
              <Card className="hertz-card max-w-md w-full mt-4">
                <CardContent className="p-4">
                  <p className="text-gray-400">{t('admin.contractNumber', locale)}: <span className="text-[#FFCC00]">{contract.contractNumber}</span></p>
                  <p className="text-gray-400">{t('admin.customerName', locale)}: <span className="text-white">{contract.customerName}</span></p>
                </CardContent>
              </Card>
            )}
            <Button variant="outline" className="mt-6 border-gray-600 text-gray-300" onClick={() => { setMode('admin'); window.location.hash = ''; }}>
              {t('common.back', locale)}
            </Button>
          </motion.div>
        </div>
      );
    }

    // Main checklist view
    return (
      <div className={`min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#252525] ${isRTL ? 'rtl' : ''}`}>
        {/* Header */}
        <div className="bg-[#FFCC00] px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-[#1a1a1a] font-bold text-lg">{t('app.title', locale)}</h1>
              <p className="text-[#1a1a1a]/70 text-sm">{t('app.subtitle', locale)}</p>
            </div>
            <Button variant="ghost" size="sm" className="text-[#1a1a1a]" onClick={() => setShowLanguageSelect(true)}>
              <Globe className="w-4 h-4 mr-1" />
              {LOCALES[locale]}
            </Button>
          </div>
        </div>

        {/* Vehicle Info */}
        {contract && (
          <div className="max-w-lg mx-auto px-4 mt-4">
            <Card className="hertz-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400 text-xs">{t('admin.contractNumber', locale)}</span>
                    <p className="text-[#FFCC00] font-semibold">{contract.contractNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">{t('admin.customerName', locale)}</span>
                    <p className="text-white">{contract.customerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">{t('admin.vehiclePlate', locale)}</span>
                    <p className="text-white">{contract.vehiclePlate}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">{t('admin.vehicleModel', locale)}</span>
                    <p className="text-white">{contract.vehicleModel}</p>
                  </div>
                  {contract.vehicleColor && (
                    <div className="col-span-2">
                      <span className="text-gray-400 text-xs">{t('admin.vehicleColor', locale)}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-gray-400" style={{ backgroundColor: contract.vehicleColor.toLowerCase() }} />
                        <p className="text-white">{contract.vehicleColor}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Car Diagram */}
        {contract && (
          <div className="max-w-lg mx-auto px-4 mt-4">
            <Card className="hertz-card">
              <CardContent className="p-4">
                <p className="text-gray-300 text-sm mb-3 text-center">{t('checklist.title', locale)}</p>
                <CarDiagram
                  checklist={checklist}
                  locale={locale}
                  onSelect={(key) => {
                    const req = checklist.find(r => r.key === key);
                    if (req) setSelectedRequirement(req.id);
                  }}
                  getReqLabel={getReqLabel}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Checklist Items */}
        <div className="max-w-lg mx-auto px-4 mt-4 space-y-3 pb-20">
          <AnimatePresence>
            {checklist.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: req.orderIndex * 0.05 }}
              >
                <Card className={`hertz-card ${selectedRequirement === req.id ? 'ring-2 ring-[#FFCC00]' : ''}`}
                  onClick={() => setSelectedRequirement(req.id)}>
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getReqIcon(req.icon)}
                        <span className="text-white font-medium">{getReqLabel(req)}</span>
                        {req.required ? (
                          <Badge variant="outline" className="border-[#FFCC00]/50 text-[#FFCC00] text-xs">{t('checklist.required', locale)}</Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-500 text-gray-400 text-xs">{t('checklist.optional', locale)}</Badge>
                        )}
                      </div>
                      {(req.submissions?.length || 0) > 0 && (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      )}
                    </div>

                    {/* Description */}
                    {req.description && (
                      <p className="text-gray-400 text-xs mb-3">{locale === 'en' ? (req.description || '') : req.description}</p>
                    )}

                    {/* Photo/Video Mode Toggle */}
                    {req.allowVideo && (req.submissions?.length || 0) < 10 && (
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-gray-400 text-xs">{t('video.photoMode', locale)}</span>
                        <Switch
                          checked={mediaModes[req.id] === 'video'}
                          onCheckedChange={(checked) =>
                            setMediaModes(prev => ({ ...prev, [req.id]: checked ? 'video' : 'photo' }))
                          }
                          className="data-[state=checked]:bg-[#FFCC00]"
                        />
                        <span className="text-gray-400 text-xs">{t('video.videoMode', locale)}</span>
                      </div>
                    )}

                    {/* Upload Buttons */}
                    {(req.submissions?.length || 0) < 10 && (
                      <div className="flex gap-2 mb-3">
                        {mediaModes[req.id] === 'video' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#FFCC00]/30 text-[#FFCC00] hover:bg-[#FFCC00]/10"
                              disabled={uploadingItem === req.id}
                              onClick={() => {
                                const input = fileInputRefs.current[req.id + '_video'];
                                if (input) {
                                  input.setAttribute('accept', 'video/mp4,video/webm,video/quicktime,video/avi');
                                  input.click();
                                }
                              }}
                            >
                              {uploadingItem === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                              <span className="ml-1">{t('video.record', locale)}</span>
                            </Button>
                            <span className="text-gray-400 text-xs flex items-center">
                              <Info className="w-3 h-3 mr-1" />
                              {t('video.maxDuration', locale)}
                            </span>
                            <input
                              ref={(el) => { fileInputRefs.current[req.id + '_video'] = el; }}
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime,video/avi"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadMedia(req.id, file, 'video');
                                e.target.value = '';
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#FFCC00]/30 text-[#FFCC00] hover:bg-[#FFCC00]/10"
                              disabled={uploadingItem === req.id}
                              onClick={() => {
                                const input = fileInputRefs.current[req.id + '_photo'];
                                if (input) {
                                  input.setAttribute('accept', 'image/jpeg,image/png,image/webp,image/heic');
                                  input.click();
                                }
                              }}
                            >
                              {uploadingItem === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                              <span className="ml-1">{t('video.takePhoto', locale)}</span>
                            </Button>
                            <input
                              ref={(el) => { fileInputRefs.current[req.id + '_photo'] = el; }}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/heic"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadMedia(req.id, file, 'photo');
                                e.target.value = '';
                              }}
                            />
                          </>
                        )}
                      </div>
                    )}

                    {/* Existing submissions preview */}
                    {req.submissions && req.submissions.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {req.submissions.map((sub) => (
                          <div key={sub.id} className="relative flex-shrink-0">
                            {sub.mediaType === 'video' ? (
                              <div className="w-20 h-20 rounded-lg bg-gray-800 border border-[#FFCC00]/30 flex items-center justify-center video-thumbnail">
                                <Video className="w-6 h-6 text-[#FFCC00]" />
                                <Play className="w-4 h-4 text-white absolute z-10" />
                                {sub.duration && (
                                  <Badge className="absolute bottom-1 right-1 bg-[#1a1a1a] text-[#FFCC00] text-xs z-10">
                                    {sub.duration}{t('video.seconds', locale)}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-gray-800 border border-[#FFCC00]/30 flex items-center justify-center">
                                <Camera className="w-6 h-6 text-[#FFCC00]" />
                              </div>
                            )}
                            <Badge className="absolute top-1 left-1 bg-[#1a1a1a] text-xs z-10">
                              {sub.mediaType === 'video' ? 'V' : 'P'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Count summary */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>{(req.photoCount || 0)} photos, {(req.videoCount || 0)} videos</span>
                      <span>({getTotalMedia(req)}/10 max)</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Submit Button */}
        {contract && accessToken && !accessToken.usedAt && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur border-t border-[#FFCC00]/20 p-4">
            <div className="max-w-lg mx-auto">
              <Button
                className="hertz-btn-gold w-full py-3 text-lg"
                disabled={!allRequiredCompleted}
                onClick={handleSubmit}
              >
                <Send className="w-5 h-5 mr-2" />
                {t('checklist.submit', locale)}
              </Button>
              {!allRequiredCompleted && (
                <p className="text-gray-400 text-xs mt-2 text-center">{t('checklist.allRequired', locale)}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== ADMIN DASHBOARD ====================
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#252525]">
      {/* Header */}
      <div className="bg-[#FFCC00] px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#1a1a1a]" />
            <div>
              <h1 className="text-[#1a1a1a] font-bold text-xl">{t('admin.title', locale)}</h1>
              <p className="text-[#1a1a1a]/70 text-sm">Hertz Malta Vehicle Check-in Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-[#1a1a1a]" onClick={() => seedRequirements()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Seed
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="hertz-card">
            <CardContent className="p-4 text-center">
              <p className="text-gray-400 text-xs">{t('admin.totalContracts', locale)}</p>
              <p className="text-[#FFCC00] font-bold text-2xl">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="hertz-card">
            <CardContent className="p-4 text-center">
              <p className="text-gray-400 text-xs">{t('admin.pending', locale)}</p>
              <p className="text-yellow-400 font-bold text-2xl">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="hertz-card">
            <CardContent className="p-4 text-center">
              <p className="text-gray-400 text-xs">{t('admin.inProgress', locale)}</p>
              <p className="text-blue-400 font-bold text-2xl">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card className="hertz-card">
            <CardContent className="p-4 text-center">
              <p className="text-gray-400 text-xs">{t('admin.completed', locale)}</p>
              <p className="text-green-400 font-bold text-2xl">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-6xl mx-auto px-4 mt-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t('admin.search', locale)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#333] border-gray-600 text-white placeholder-gray-500"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-[#333] border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#333] border-gray-600">
            <SelectItem value="all">{t('admin.all', locale)}</SelectItem>
            <SelectItem value="pending">{t('admin.pending', locale)}</SelectItem>
            <SelectItem value="in_progress">{t('admin.inProgress', locale)}</SelectItem>
            <SelectItem value="completed">{t('admin.completed', locale)}</SelectItem>
          </SelectContent>
        </Select>
        <Button className="hertz-btn-gold" onClick={() => setShowNewContract(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t('admin.newContract', locale)}
        </Button>
        <Button variant="outline" className="border-gray-600 text-gray-300 hover:border-[#FFCC00] hover:text-[#FFCC00]"
          onClick={() => setShowBulkUpload(true)}>
          <FileUp className="w-4 h-4 mr-1" />
          {t('admin.bulkUpload', locale)}
        </Button>
      </div>

      {/* Contracts Table */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        {filteredContracts.length === 0 ? (
          <Card className="hertz-card">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">{t('admin.noContracts', locale)}</p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="max-h-[600px] custom-scrollbar">
            <div className="space-y-2">
              {filteredContracts.map((c) => (
                <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="hertz-card hover:hertz-glow transition-all">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Left: Contract info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[#FFCC00] font-semibold">{c.contractNumber}</span>
                            <StatusBadge status={c.status} locale={locale} />
                          </div>
                          <div className="text-sm text-gray-300 grid grid-cols-2 gap-x-4 gap-y-1">
                            <span>{c.customerName}</span>
                            <span>{c.vehiclePlate}</span>
                            <span className="text-gray-400">{c.vehicleModel}</span>
                            {c.vehicleColor && <span className="text-gray-400">{c.vehicleColor}</span>}
                          </div>
                          {/* Token info */}
                          {c.tokens && c.tokens.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {c.tokens.map((tk) => (
                                <div key={tk.id} className="flex items-center gap-2 text-xs">
                                  <Link className="w-3 h-3 text-gray-400" />
                                  <code className="text-gray-400 bg-[#333] px-2 py-0.5 rounded select-all">{tk.token}</code>
                                  <span className="text-gray-500">
                                    {t('admin.tokenExpiry', locale)}: {new Date(tk.expiresAt).toLocaleString()}
                                  </span>
                                  {tk.usedAt && <Badge className="bg-green-500/20 text-green-400 text-xs">Used</Badge>}
                                  <Button variant="ghost" size="sm" className="h-6 text-gray-400 hover:text-[#FFCC00]"
                                    onClick={() => copyTokenLink(tk.token)}>
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Media count */}
                          {c.media && c.media.length > 0 && (
                            <div className="mt-1 text-xs text-gray-400">
                              <Eye className="w-3 h-3 inline mr-1" />
                              {c.media.length} {t('admin.mediaCount', locale)}
                              ({c.media.filter(m => m.mediaType === 'photo').length} photos, {c.media.filter(m => m.mediaType === 'video').length} videos)
                            </div>
                          )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex gap-1 flex-shrink-0">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#FFCC00]"
                                  onClick={() => generateToken(c.id)}>
                                  <QrCode className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('admin.generateToken', locale)}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400"
                            onClick={() => { setEditingContract(c); setShowEditContract(true); }}>
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#252525] border-gray-600 text-white">
                              <AlertDialogTitle>{t('admin.deleteConfirmTitle', locale)}</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                {t('admin.deleteConfirm', locale)}
                              </AlertDialogDescription>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-[#333] text-gray-300 border-gray-600">{t('admin.cancel', locale)}</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-500 text-white" onClick={() => deleteContract(c.id)}>
                                  {t('admin.delete', locale)}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* New Contract Dialog */}
      <Dialog open={showNewContract} onOpenChange={setShowNewContract}>
        <DialogContent className="bg-[#252525] border-gray-600 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#FFCC00]">{t('admin.newContract', locale)}</DialogTitle>
            <DialogDescription className="text-gray-400">Create a new rental contract with auto-generated token</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <Label className="text-gray-300">{t('admin.contractNumber', locale)} *</Label>
              <Input className="bg-[#333] border-gray-600 text-white" value={newContract.contractNumber}
                onChange={(e) => setNewContract(p => ({ ...p, contractNumber: e.target.value }))} />
            </div>
            <div>
              <Label className="text-gray-300">{t('admin.customerName', locale)} *</Label>
              <Input className="bg-[#333] border-gray-600 text-white" value={newContract.customerName}
                onChange={(e) => setNewContract(p => ({ ...p, customerName: e.target.value }))} />
            </div>
            <div>
              <Label className="text-gray-300">{t('admin.customerEmail', locale)}</Label>
              <Input className="bg-[#333] border-gray-600 text-white" type="email" value={newContract.customerEmail}
                onChange={(e) => setNewContract(p => ({ ...p, customerEmail: e.target.value }))} />
            </div>
            <div>
              <Label className="text-gray-300">{t('admin.customerPhone', locale)}</Label>
              <Input className="bg-[#333] border-gray-600 text-white" type="tel" value={newContract.customerPhone}
                onChange={(e) => setNewContract(p => ({ ...p, customerPhone: e.target.value }))} />
            </div>
            <div>
              <Label className="text-gray-300">{t('admin.vehiclePlate', locale)} *</Label>
              <Input className="bg-[#333] border-gray-600 text-white" value={newContract.vehiclePlate}
                onChange={(e) => setNewContract(p => ({ ...p, vehiclePlate: e.target.value }))} />
            </div>
            <div>
              <Label className="text-gray-300">{t('admin.vehicleModel', locale)} *</Label>
              <Input className="bg-[#333] border-gray-600 text-white" value={newContract.vehicleModel}
                onChange={(e) => setNewContract(p => ({ ...p, vehicleModel: e.target.value }))} />
            </div>
            <div>
              <Label className="text-gray-300">{t('admin.vehicleColor', locale)}</Label>
              <Input className="bg-[#333] border-gray-600 text-white" value={newContract.vehicleColor}
                onChange={(e) => setNewContract(p => ({ ...p, vehicleColor: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setShowNewContract(false)}>
              {t('admin.cancel', locale)}
            </Button>
            <Button className="hertz-btn-gold" onClick={createContract}>
              {t('admin.create', locale)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={showEditContract} onOpenChange={setShowEditContract}>
        <DialogContent className="bg-[#252525] border-gray-600 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#FFCC00]">{t('admin.edit', locale)}</DialogTitle>
          </DialogHeader>
          {editingContract && (
            <div className="space-y-3 py-4">
              <div>
                <Label className="text-gray-300">{t('admin.contractNumber', locale)}</Label>
                <Input className="bg-[#333] border-gray-600 text-white" value={editingContract.contractNumber}
                  onChange={(e) => setEditingContract(p => p ? ({ ...p, contractNumber: e.target.value }) : p)} />
              </div>
              <div>
                <Label className="text-gray-300">{t('admin.customerName', locale)}</Label>
                <Input className="bg-[#333] border-gray-600 text-white" value={editingContract.customerName}
                  onChange={(e) => setEditingContract(p => p ? ({ ...p, customerName: e.target.value }) : p)} />
              </div>
              <div>
                <Label className="text-gray-300">{t('admin.customerEmail', locale)}</Label>
                <Input className="bg-[#333] border-gray-600 text-white" value={editingContract.customerEmail || ''}
                  onChange={(e) => setEditingContract(p => p ? ({ ...p, customerEmail: e.target.value }) : p)} />
              </div>
              <div>
                <Label className="text-gray-300">{t('admin.customerPhone', locale)}</Label>
                <Input className="bg-[#333] border-gray-600 text-white" value={editingContract.customerPhone || ''}
                  onChange={(e) => setEditingContract(p => p ? ({ ...p, customerPhone: e.target.value }) : p)} />
              </div>
              <div>
                <Label className="text-gray-300">{t('admin.vehiclePlate', locale)}</Label>
                <Input className="bg-[#333] border-gray-600 text-white" value={editingContract.vehiclePlate}
                  onChange={(e) => setEditingContract(p => p ? ({ ...p, vehiclePlate: e.target.value }) : p)} />
              </div>
              <div>
                <Label className="text-gray-300">{t('admin.vehicleModel', locale)}</Label>
                <Input className="bg-[#333] border-gray-600 text-white" value={editingContract.vehicleModel}
                  onChange={(e) => setEditingContract(p => p ? ({ ...p, vehicleModel: e.target.value }) : p)} />
              </div>
              <div>
                <Label className="text-gray-300">{t('admin.vehicleColor', locale)}</Label>
                <Input className="bg-[#333] border-gray-600 text-white" value={editingContract.vehicleColor || ''}
                  onChange={(e) => setEditingContract(p => p ? ({ ...p, vehicleColor: e.target.value }) : p)} />
              </div>
              <div>
                <Label className="text-gray-300">{t('admin.status', locale)}</Label>
                <Select value={editingContract.status} onValueChange={(v) => setEditingContract(p => p ? ({ ...p, status: v }) : p)}>
                  <SelectTrigger className="bg-[#333] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#333] border-gray-600">
                    <SelectItem value="pending">{t('admin.pending', locale)}</SelectItem>
                    <SelectItem value="in_progress">{t('admin.inProgress', locale)}</SelectItem>
                    <SelectItem value="completed">{t('admin.completed', locale)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setShowEditContract(false)}>
              {t('admin.cancel', locale)}
            </Button>
            <Button className="hertz-btn-gold" onClick={updateContract}>
              {t('admin.save', locale)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent className="bg-[#252525] border-gray-600 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#FFCC00]">{t('admin.bulkUpload', locale)}</DialogTitle>
            <DialogDescription className="text-gray-400">Upload an Excel file (.xlsx) with contract data</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-[#FFCC00] transition-colors">
              <FileUp className="w-12 h-12 text-gray-400 mb-3 mx-auto" />
              <p className="text-gray-300 mb-2">{t('admin.uploadExcel', locale)}</p>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="bg-[#333] border-gray-600 text-white"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) bulkUpload(file);
                }}
                disabled={bulkUploading}
              />
              {bulkUploading && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#FFCC00]" />
                  <span className="text-gray-300">Processing...</span>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-xs mt-3">
              Supported columns: Rental/Contract, Customer/Name, Email, Phone, Plate/License, Model/Car, Color
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setShowBulkUpload(false)}>
              {t('admin.close', locale)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="mt-auto py-6 text-center text-gray-500 text-xs">
        Hertz Malta Vehicle Check-in Portal — Admin Dashboard
      </div>
    </div>
  );
}

// ==================== Sub-components ====================

function StatusBadge({ status, locale }: { status: string; locale: Locale }) {
  const config: Record<string, { label: string; cls: string }> = {
    pending: { label: t('admin.pending', locale), cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    in_progress: { label: t('admin.inProgress', locale), cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    completed: { label: t('admin.completed', locale), cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  };
  const c = config[status] || { label: status, cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
  return <Badge variant="outline" className={c.cls}>{c.label}</Badge>;
}

function CarDiagram({
  checklist,
  locale,
  onSelect,
  getReqLabel,
}: {
  checklist: PhotoRequirement[];
  locale: Locale;
  onSelect: (key: string) => void;
  getReqLabel: (req: PhotoRequirement) => string;
}) {
  // Get counts per key
  const counts: Record<string, number> = {};
  const completed: Record<string, boolean> = {};
  checklist.forEach(r => {
    counts[r.key] = (r.submissions?.length || 0);
    completed[r.key] = (r.submissions?.length || 0) > 0;
  });

  return (
    <svg viewBox="0 0 300 180" className="w-full max-w-xs mx-auto">
      {/* Car body */}
      <rect x="60" y="50" width="180" height="70" rx="20" fill="#333" stroke="#FFCC00" strokeWidth="1.5" />

      {/* Car roof */}
      <path d="M90 50 Q150 20 210 50" fill="#333" stroke="#FFCC00" strokeWidth="1.5" />

      {/* Wheels */}
      <circle cx="100" cy="120" r="18" fill="#444" stroke="#FFCC00" strokeWidth="1.5" />
      <circle cx="100" cy="120" r="8" fill="#333" />
      <circle cx="200" cy="120" r="18" fill="#444" stroke="#FFCC00" strokeWidth="1.5" />
      <circle cx="200" cy="120" r="8" fill="#333" />

      {/* Interior area */}
      <rect x="95" y="32" width="110" height="16" rx="4" fill="transparent" stroke="#FFCC00" strokeWidth="0.5" />

      {/* Clickable zones */}
      {/* Front zone */}
      <g className="car-zone" onClick={() => onSelect('front')}>
        <rect x="60" y="50" width="35" height="70" rx="10" fill={completed['front'] ? '#4CAF50' : '#FFCC00'} fillOpacity="0.3" stroke={completed['front'] ? '#4CAF50' : '#FFCC00'} strokeWidth="1" />
        <text x="77" y="90" textAnchor="middle" fill="white" fontSize="8">{getPhotoLabel('front', locale)}</text>
        {counts['front'] > 0 && (
          <g>
            <circle cx="77" cy="62" r="8" fill={completed['front'] ? '#4CAF50' : '#FFCC00'} />
            <text x="77" y="65" textAnchor="middle" fill="#1a1a1a" fontSize="8" fontWeight="bold">{counts['front']}</text>
          </g>
        )}
      </g>

      {/* Passenger side */}
      <g className="car-zone" onClick={() => onSelect('passenger_side')}>
        <rect x="95" y="70" width="110" height="25" rx="4" fill={completed['passenger_side'] ? '#4CAF50' : '#FFCC00'} fillOpacity="0.3" stroke={completed['passenger_side'] ? '#4CAF50' : '#FFCC00'} strokeWidth="1" />
        <text x="150" y="87" textAnchor="middle" fill="white" fontSize="8">{getPhotoLabel('passenger_side', locale)}</text>
        {counts['passenger_side'] > 0 && (
          <g>
            <circle cx="130" cy="73" r="8" fill={completed['passenger_side'] ? '#4CAF50' : '#FFCC00'} />
            <text x="130" y="76" textAnchor="middle" fill="#1a1a1a" fontSize="8" fontWeight="bold">{counts['passenger_side']}</text>
          </g>
        )}
      </g>

      {/* Back zone */}
      <g className="car-zone" onClick={() => onSelect('back')}>
        <rect x="205" y="50" width="35" height="70" rx="10" fill={completed['back'] ? '#4CAF50' : '#FFCC00'} fillOpacity="0.3" stroke={completed['back'] ? '#4CAF50' : '#FFCC00'} strokeWidth="1" />
        <text x="222" y="90" textAnchor="middle" fill="white" fontSize="8">{getPhotoLabel('back', locale)}</text>
        {counts['back'] > 0 && (
          <g>
            <circle cx="222" cy="62" r="8" fill={completed['back'] ? '#4CAF50' : '#FFCC00'} />
            <text x="222" y="65" textAnchor="middle" fill="#1a1a1a" fontSize="8" fontWeight="bold">{counts['back']}</text>
          </g>
        )}
      </g>

      {/* Driver side */}
      <g className="car-zone" onClick={() => onSelect('driver_side')}>
        <rect x="95" y="45" width="110" height="25" rx="4" fill={completed['driver_side'] ? '#4CAF50' : '#FFCC00'} fillOpacity="0.3" stroke={completed['driver_side'] ? '#4CAF50' : '#FFCC00'} strokeWidth="1" />
        <text x="150" y="62" textAnchor="middle" fill="white" fontSize="8">{getPhotoLabel('driver_side', locale)}</text>
        {counts['driver_side'] > 0 && (
          <g>
            <circle cx="170" cy="48" r="8" fill={completed['driver_side'] ? '#4CAF50' : '#FFCC00'} />
            <text x="170" y="51" textAnchor="middle" fill="#1a1a1a" fontSize="8" fontWeight="bold">{counts['driver_side']}</text>
          </g>
        )}
      </g>

      {/* Interior zone */}
      <g className="car-zone" onClick={() => onSelect('interior')}>
        <rect x="95" y="30" width="110" height="16" rx="4" fill={completed['interior'] ? '#4CAF50' : '#FFCC00'} fillOpacity="0.3" stroke={completed['interior'] ? '#4CAF50' : '#FFCC00'} strokeWidth="1" />
        <text x="150" y="41" textAnchor="middle" fill="white" fontSize="8">{getPhotoLabel('interior', locale)}</text>
        {counts['interior'] > 0 && (
          <g>
            <circle cx="112" cy="34" r="8" fill={completed['interior'] ? '#4CAF50' : '#FFCC00'} />
            <text x="112" y="37" textAnchor="middle" fill="#1a1a1a" fontSize="8" fontWeight="bold">{counts['interior']}</text>
          </g>
        )}
      </g>
    </svg>
  );
}
