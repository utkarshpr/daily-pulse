import React, { useState } from 'react';
import { X, Copy, Lock, Unlock } from 'lucide-react';
import { encryptString, decryptString } from '../lib/crypto';

export default function EncryptDialog({ open, mode, onClose, getPlaintext, onDecrypted, flash }) {
  const [password, setPassword] = useState('');
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleEncrypt = async () => {
    if (!password) return flash?.('Enter a password', true);
    setBusy(true);
    try {
      const pt = getPlaintext();
      const blob = await encryptString(pt, password);
      setOutput(blob);
      flash?.('Encrypted — copy and store safely');
    } catch {
      flash?.('Encryption failed', true);
    } finally {
      setBusy(false);
    }
  };

  const handleDecrypt = async () => {
    if (!password || !input.trim()) return flash?.('Paste blob and enter password', true);
    setBusy(true);
    try {
      const pt = await decryptString(input.trim(), password);
      const data = JSON.parse(pt);
      onDecrypted?.(data);
      flash?.('Decrypted and imported');
      onClose();
    } catch {
      flash?.('Wrong password or corrupt blob', true);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setPassword('');
    setOutput('');
    setInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center px-4 animate-fade-in" onClick={close}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className="relative card max-w-md w-full p-6 animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={close}
          className="absolute top-3 right-3 size-8 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center"
          aria-label="Close"
        >
          <X size={14} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/30">
            {mode === 'encrypt' ? <Lock size={18} /> : <Unlock size={18} />}
          </div>
          <h3 className="text-lg font-bold">
            {mode === 'encrypt' ? 'Encrypted backup' : 'Restore from blob'}
          </h3>
        </div>

        <label className="text-xs uppercase tracking-wider text-slate-500">Password</label>
        <input
          type="password"
          autoFocus
          className="input mt-1"
          placeholder="Choose a strong passphrase"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mode === 'decrypt' && (
          <>
            <label className="text-xs uppercase tracking-wider text-slate-500 mt-3 block">Encrypted blob</label>
            <textarea
              className="input mt-1 min-h-[120px] resize-y font-mono text-[11px]"
              placeholder="DPv1.…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </>
        )}

        {mode === 'encrypt' && output && (
          <div className="mt-4">
            <label className="text-xs uppercase tracking-wider text-slate-500">Your encrypted blob (copy & save)</label>
            <textarea
              readOnly
              value={output}
              className="input mt-1 min-h-[120px] resize-y font-mono text-[11px]"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              className="btn-ghost mt-2 w-full justify-center"
              onClick={() => {
                navigator.clipboard.writeText(output);
                flash?.('Copied to clipboard');
              }}
            >
              <Copy size={14} /> Copy
            </button>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={close}>Close</button>
          <button
            className="btn-primary"
            onClick={mode === 'encrypt' ? handleEncrypt : handleDecrypt}
            disabled={busy}
          >
            {mode === 'encrypt' ? <><Lock size={16} /> Encrypt</> : <><Unlock size={16} /> Decrypt & import</>}
          </button>
        </div>

        <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
          AES-256-GCM with PBKDF2 (200k iterations). Forget the password and the blob is irrecoverable — there is no backdoor.
        </p>
      </div>
    </div>
  );
}
