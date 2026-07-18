'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Upload, FileSpreadsheet, UserPlus, Car, Copy, Check, Eye,
  Clock, AlertCircle, CheckCircle2, XCircle, Camera, Loader2,
  ExternalLink, RefreshCw, Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TokenRecord {
  id: string;
  uuid: string;
  customerName: string;
  customerEmail: string;
  vehicle: string;
  model: string | null;
  rentalRef: string | null;
  checkoutDate: string;
  status: string;
  source: string;
  noDamage: boolean;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  photos: { id: string; fileName: string; uploadedAt: string }[];
}

interface PhotoRecord {
  id: string;
  fileName: string;
  mimeType: string;
  data: string;
  note: string | null;
  uploadedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { label: 'In attesa', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  emailed: { label: 'Inviato', variant: 'default', icon: <AlertCircle className="h-3 w-3" /> },
  used: { label: 'Completato', variant: 'outline', icon: <CheckCircle2 className="h-3 w-3" /> },
  expired: { label: 'Scaduto', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  cancelled: { label: 'Annullato', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
};

export default function StaffDashboard() {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; skipped: number } | null>(null);
  const [walkinForm, setWalkinForm] = useState({ customerName: '', customerEmail: '', vehicle: '', model: '', rentalRef: '' });
  const [walkinSubmitting, setWalkinSubmitting] = useState(false);
  const [walkinDialogOpen, setWalkinDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenRecord | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoRecord[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch('/api/tokens');
      const data = await res.json();
      setTokens(data);
    } catch {
      toast({ title: 'Errore', description: 'Errore nel caricamento dei token', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleExcelUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/tokens/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        toast({ title: 'Errore', description: data.error, variant: 'destructive' });
      } else {
        setUploadResult({ success: data.success, skipped: data.skipped });
        toast({ title: 'Excel caricato', description: `${data.success} token generati, ${data.skipped} saltati` });
        fetchTokens();
      }
    } catch {
      toast({ title: 'Errore', description: "Errore nell'upload del file", variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [fetchTokens]);

  const handleWalkinSubmit = useCallback(async () => {
    if (!walkinForm.customerName || !walkinForm.customerEmail || !walkinForm.vehicle) {
      toast({ title: 'Campi mancanti', description: 'Compila nome, email e targa', variant: 'destructive' });
      return;
    }

    setWalkinSubmitting(true);

    try {
      const res = await fetch('/api/tokens/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walkinForm),
      });

      const data = await res.json();

      if (data.error) {
        toast({ title: 'Errore', description: data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Token creato', description: `Token creato per ${walkinForm.vehicle}` });
        setWalkinForm({ customerName: '', customerEmail: '', vehicle: '', model: '', rentalRef: '' });
        setWalkinDialogOpen(false);
        fetchTokens();
      }
    } catch {
      toast({ title: 'Errore', description: 'Errore nella creazione del token', variant: 'destructive' });
    } finally {
      setWalkinSubmitting(false);
    }
  }, [walkinForm, fetchTokens]);

  const copyLink = useCallback((uuid: string) => {
    const link = `${window.location.origin}/?token=${uuid}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Copiato', description: 'Link copiato negli appunti' });
  }, []);

  const viewPhotos = useCallback(async (token: TokenRecord) => {
    setSelectedToken(token);
    setPhotoDialogOpen(true);
    setLoadingPhotos(true);

    try {
      const res = await fetch(`/api/tokens/${token.id}/photos`);
      const data = await res.json();
      setSelectedPhotos(data);
    } catch {
      toast({ title: 'Errore', description: 'Errore nel caricamento delle foto', variant: 'destructive' });
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('it-IT', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Stats
  const totalTokens = tokens.length;
  const completedTokens = tokens.filter(t => t.status === 'used').length;
  const pendingTokens = tokens.filter(t => t.status === 'emailed' || t.status === 'pending').length;
  const withPhotos = tokens.filter(t => t.photos.length > 0 && t.status === 'used').length;
  const noDamage = tokens.filter(t => t.noDamage && t.status === 'used').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight">Hertz Photo Token</h1>
              <p className="text-xs text-muted-foreground">Dashboard Staff</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchTokens} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{totalTokens}</p>
              <p className="text-xs text-muted-foreground">Token totali</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{pendingTokens}</p>
              <p className="text-xs text-muted-foreground">In attesa</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{completedTokens}</p>
              <p className="text-xs text-muted-foreground">Completati</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{withPhotos}</p>
              <p className="text-xs text-muted-foreground">Con foto</p>
              <p className="text-xs text-muted-foreground">{noDamage} conferme &quot;no danno&quot;</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Excel Upload */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                Carica Check-outs Excel
              </CardTitle>
              <CardDescription className="text-xs">
                Carica il file Excel dei check-out del giorno. I token verranno generati automaticamente per ogni veicolo con targa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleExcelUpload}
              />
              <Button
                variant="outline"
                className="w-full border-dashed h-24 text-muted-foreground hover:text-foreground hover:border-solid"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Elaborazione in corso...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Seleziona file .xlsx
                  </>
                )}
              </Button>
              {uploadResult && (
                <p className="text-xs text-muted-foreground mt-2">
                  <Check className="inline h-3 w-3 text-green-600 mr-1" />
                  {uploadResult.success} token creati
                  {uploadResult.skipped > 0 && `, ${uploadResult.skipped} gia esistenti saltati`}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Walk-in */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-600" />
                Walk-in (senza prenotazione)
              </CardTitle>
              <CardDescription className="text-xs">
                Per i clienti che entrano senza prenotazione. Inserisci i dati e genera un token.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={walkinDialogOpen} onOpenChange={setWalkinDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Nuovo Walk-in
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nuovo Cliente Walk-in</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div>
                      <Label className="text-xs">Nome Cliente *</Label>
                      <Input
                        placeholder="Mario Rossi"
                        value={walkinForm.customerName}
                        onChange={e => setWalkinForm(f => ({ ...f, customerName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email Cliente *</Label>
                      <Input
                        type="email"
                        placeholder="mario@email.com"
                        value={walkinForm.customerEmail}
                        onChange={e => setWalkinForm(f => ({ ...f, customerEmail: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Targa *</Label>
                        <Input
                          placeholder="AB123CD"
                          value={walkinForm.vehicle}
                          onChange={e => setWalkinForm(f => ({ ...f, vehicle: e.target.value.toUpperCase() }))}
                          className="uppercase"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Modello</Label>
                        <Input
                          placeholder="i20, i10..."
                          value={walkinForm.model}
                          onChange={e => setWalkinForm(f => ({ ...f, model: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Riferimento Noleggio</Label>
                      <Input
                        placeholder="RES-XXXXX"
                        value={walkinForm.rentalRef}
                        onChange={e => setWalkinForm(f => ({ ...f, rentalRef: e.target.value }))}
                      />
                    </div>
                    <Button
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={handleWalkinSubmit}
                      disabled={walkinSubmitting}
                    >
                      {walkinSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Genera Token
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Token list */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tutti i Token</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tokens.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Nessun token. Carica un file Excel o crea un walk-in.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Veicolo</TableHead>
                      <TableHead className="text-xs">Cliente</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Modello</TableHead>
                      <TableHead className="text-xs">Stato</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Foto</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">Creato</TableHead>
                      <TableHead className="text-xs text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map(token => {
                      const statusCfg = STATUS_CONFIG[token.status] || STATUS_CONFIG.pending;
                      return (
                        <TableRow key={token.id}>
                          <TableCell className="font-mono font-bold text-sm">{token.vehicle}</TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">{token.customerName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{token.model || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={statusCfg.variant} className="text-xs gap-1">
                              {statusCfg.icon}
                              {statusCfg.label}
                            </Badge>
                            {token.noDamage && token.status === 'used' && (
                              <Badge variant="outline" className="ml-1 text-xs text-green-600 border-green-300">
                                No danni
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {token.photos.length > 0 ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs gap-1"
                                onClick={() => viewPhotos(token)}
                              >
                                <Camera className="h-3 w-3" />
                                {token.photos.length}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                            {formatDate(token.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyLink(token.uuid)}
                                title="Copia link"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => viewPhotos(token)}
                                title="Vedi dettagli"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {token.status !== 'used' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => window.open(`/?token=${token.uuid}`, '_blank')}
                                  title="Apri pagina cliente"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Photo viewer dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-amber-600" />
              {selectedToken?.vehicle} — Foto Caricate
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedToken?.customerName} | {selectedToken?.source === 'walkin' ? 'Walk-in' : 'Prenotazione'}
            </p>
          </DialogHeader>
          {loadingPhotos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : selectedPhotos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {selectedToken?.noDamage ? (
                <>
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
                  <p>Il cliente ha confermato: <strong>Nessun danno aggiuntivo</strong></p>
                  <p className="text-xs mt-1">Registrato il {formatDate(selectedToken.usedAt || '')}</p>
                </>
              ) : (
                <>
                  <Camera className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Nessuna foto caricata</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedPhotos.map(photo => (
                <div key={photo.id} className="border rounded-lg overflow-hidden">
                  <img
                    src={`data:${photo.mimeType};base64,${photo.data}`}
                    alt={photo.fileName}
                    className="w-full max-h-80 object-contain bg-black/5"
                  />
                  <div className="p-3 bg-muted/30">
                    <p className="text-sm font-medium">{photo.fileName}</p>
                    {photo.note && (
                      <p className="text-sm text-muted-foreground mt-1">{photo.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(photo.uploadedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}