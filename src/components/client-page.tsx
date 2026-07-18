'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, Check, AlertTriangle, X, ImagePlus, Loader2, ShieldCheck, Car } from 'lucide-react';

interface TokenData {
  id: string;
  customerName: string;
  vehicle: string;
  model: string | null;
  rentalRef: string | null;
  checkoutDate: string;
  expiresAt: string;
  status: string;
  source: string;
  photoCount: number;
  photos: { id: string; fileName: string; note: string | null; uploadedAt: string }[];
}

interface PhotoFile {
  file: File;
  preview: string;
  note: string;
}

export default function ClientPage() {
  const searchParams = useSearchParams();
  const tokenUuid = searchParams.get('token');

  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!tokenUuid) {
      setError('Link non valido: token mancante.');
      setLoading(false);
      return;
    }

    fetch(`/api/tokens/check?token=${encodeURIComponent(tokenUuid)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setTokenData(data);
        }
      })
      .catch(() => setError('Errore di connessione. Riprova.'))
      .finally(() => setLoading(false));
  }, [tokenUuid]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PhotoFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      newPhotos.push({
        file,
        preview: URL.createObjectURL(file),
        note: '',
      });
    }
    setPhotos(prev => [...prev, ...newPhotos]);
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  const updateNote = useCallback((index: number, note: string) => {
    setPhotos(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], note };
      return updated;
    });
  }, []);

  const handleSubmitPhotos = useCallback(async () => {
    if (photos.length === 0 || !tokenUuid) return;
    setSubmitting(true);

    try {
      const photoData = await Promise.all(
        photos.map(async (p) => {
          const buffer = await p.file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          return {
            fileName: p.file.name,
            mimeType: p.file.type,
            data: base64,
            note: p.note || null,
          };
        })
      );

      const res = await fetch('/api/upload-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenUuid, photos: photoData }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(true);
        setPhotos([]);
      }
    } catch {
      setError('Errore nel caricamento. Riprova.');
    } finally {
      setSubmitting(false);
    }
  }, [photos, tokenUuid]);

  const handleNoDamage = useCallback(async () => {
    if (!tokenUuid) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenUuid }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Errore nella conferma. Riprova.');
    } finally {
      setSubmitting(false);
    }
  }, [tokenUuid]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
          <p className="text-muted-foreground text-sm">Verifica link in corso...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !tokenData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Card className="w-full max-w-md shadow-lg border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <X className="h-7 w-7 text-red-600" />
            </div>
            <CardTitle className="text-red-700">Link non valido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">{error}</p>
            <p className="text-center text-xs text-muted-foreground">
              Se ritieni che questo sia un errore, contatta il personale Hertz alla stazione.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Card className="w-full max-w-md shadow-lg border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <CardTitle className="text-green-700">Registrazione completata</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Grazie! Le tue informazioni sono state registrate con successo.
              Il link non e piu utilizzabile.
            </p>
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800">
                <ShieldCheck className="inline h-4 w-4 mr-1" />
                Registro timestampato: {new Date().toLocaleString('it-IT')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center">
            <Car className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-tight">Hertz</h1>
            <p className="text-xs text-muted-foreground">Verifica Condizioni Veicolo</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Vehicle info card */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Il tuo veicolo</p>
                <p className="text-2xl font-bold">{tokenData.vehicle}</p>
                {tokenData.model && (
                  <p className="text-muted-foreground">{tokenData.model}</p>
                )}
              </div>
              <Badge variant={tokenData.source === 'walkin' ? 'secondary' : 'outline'} className="text-xs">
                {tokenData.source === 'walkin' ? 'Walk-in' : 'Prenotazione'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 text-sm">
            <strong>Istruzioni:</strong> Confronta il Condition Report ricevuto con l&apos;auto reale.
            Se trovi <strong>danni aggiuntivi non segnalati</strong>, scatta le foto e caricatele qui sotto.
            Se tutto corrisponde, premi &quot;Confermo - Nessun danno aggiuntivo&quot;.
          </AlertDescription>
        </Alert>

        {/* Photo upload area */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-5 w-5 text-amber-600" />
              Carica Foto Danni Aggiuntivi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop zone */}
            <label
              className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-4">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clicca per selezionare foto o trascinale qui
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG — multiple foto consentite
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>

            {/* Photo previews */}
            {photos.length > 0 && (
              <div className="space-y-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="flex gap-3 p-3 border rounded-lg bg-muted/30">
                    <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={photo.preview}
                        alt={photo.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{photo.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(photo.file.size / 1024).toFixed(0)} KB
                      </p>
                      <Textarea
                        placeholder="Descrivi il danno e la posizione (es. 'ammaccatura parafango anteriore destro')"
                        className="mt-1 text-xs min-h-[60px]"
                        value={photo.note}
                        onChange={e => updateNote(idx, e.target.value)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removePhoto(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Submit photos button */}
            {photos.length > 0 && (
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                size="lg"
                onClick={handleSubmitPhotos}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4 mr-2" />
                )}
                Invia {photos.length} {photos.length === 1 ? 'foto' : 'foto'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Confirm no damage */}
        <Card className="shadow-sm border-green-200">
          <CardContent className="p-4">
            <Button
              variant="outline"
              className="w-full h-14 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
              size="lg"
              onClick={handleNoDamage}
              disabled={submitting || photos.length > 0}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-5 w-5 mr-2" />
              )}
              Confermo - Nessun danno aggiuntivo
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Questo creera un record timestampato di verifica.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-6">
          Hertz Photo Token System — Link one-time, non riutilizzabile
        </p>
      </main>
    </div>
  );
}