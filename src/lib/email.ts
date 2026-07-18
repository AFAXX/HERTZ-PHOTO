import { Resend } from 'resend';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === '') return null;
  return new Resend(key);
}

export async function sendTokenEmail(params: {
  to: string;
  customerName: string;
  vehicle: string;
  model: string | null;
  tokenUuid: string;
  baseUrl: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return;
  }

  const { to, customerName, vehicle, model, tokenUuid, baseUrl } = params;
  const link = `${baseUrl}/?token=${tokenUuid}`;

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to,
    subject: `Hertz — Verifica condizioni veicolo ${vehicle}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#333;">
        <div style="background:#f59e0b;padding:20px 30px;">
          <h1 style="color:white;margin:0;font-size:22px;">Hertz</h1>
        </div>
        <div style="padding:30px;">
          <p style="font-size:16px;">Buongiorno <strong>${customerName}</strong>,</p>
          <p style="font-size:14px;line-height:1.6;">
            Grazie per aver scelto Hertz. Il tuo veicolo e pronto per il ritiro.
            Ti chiediamo di verificare le condizioni dell'auto confrontandole con il Condition Report che ti e stato fornito.
          </p>
          <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
            <table style="width:100%;font-size:14px;">
              <tr>
                <td style="padding:4px 0;"><strong>Veicolo:</strong></td>
                <td style="padding:4px 0;font-family:monospace;font-size:16px;">${vehicle}</td>
              </tr>
              ${model ? `<tr><td style="padding:4px 0;"><strong>Modello:</strong></td><td style="padding:4px 0;">${model}</td></tr>` : ''}
            </table>
          </div>
          <p style="font-size:14px;line-height:1.6;">
            Se trovi <strong>danni aggiuntivi</strong> non segnalati nel Condition Report,
            clicca il pulsante sotto e carica le foto. Se tutto corrisponde, conferma che non ci sono danni aggiuntivi.
          </p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${link}"
               style="background:#f59e0b;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">
              Verifica Condizioni Veicolo
            </a>
          </div>
          <p style="font-size:12px;color:#888;line-height:1.5;margin-top:24px;">
            Questo link e <strong>valido una sola volta</strong> e scade tra 48 ore.
            Se non hai richiesto tu questa verifica, ignora questa email.
          </p>
        </div>
        <div style="background:#f5f5f5;padding:16px 30px;font-size:11px;color:#999;text-align:center;">
          Hertz Photo Token System
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('Email send error:', error);
    throw new Error(`Errore invio email: ${error.message}`);
  }
}