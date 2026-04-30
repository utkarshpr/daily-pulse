import React, { useEffect, useState } from 'react';
import { X, Share, Home, Download, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true);

const detectPlatform = () => {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  if (isIOS) return 'ios';
  if (isAndroid) return 'android';
  return 'other';
};

export default function InstallPrompt({ open, onClose }) {
  const [platform, setPlatform] = useState('other');
  const [bipEvent, setBipEvent] = useState(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    const onBip = (e) => {
      e.preventDefault();
      setBipEvent(e);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  if (!open) return null;

  const installAndroid = async () => {
    if (!bipEvent) return;
    bipEvent.prompt();
    await bipEvent.userChoice;
    setBipEvent(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[160] grid place-items-center px-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div
        className="relative card w-full max-w-md p-6 sm:p-7 animate-pop-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 size-8 rounded-lg bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 grid place-items-center hover:scale-105 transition"
          aria-label="Close"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="size-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 grid place-items-center text-white shadow-lg shadow-violet-500/30">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 font-semibold">Install</div>
            <h3 className="text-xl font-bold">Add Daily Pulse to your home screen</h3>
          </div>
        </div>

        <p className="text-sm text-slate-500 leading-relaxed">
          Runs full-screen, opens instantly, and remembers your data across visits.
        </p>

        {platform === 'android' && (
          <div className="mt-5">
            {bipEvent ? (
              <button onClick={installAndroid} className="btn-primary w-full justify-center">
                <Download size={16} /> Install on this device
              </button>
            ) : (
              <Steps
                heading="Android"
                steps={[
                  ['Tap the ⋮ menu in your browser', null],
                  ['Choose "Install app" or "Add to Home Screen"', <Home size={14} key="h" />],
                  ['Open from your home screen for the full experience', null],
                ]}
              />
            )}
            <Note>
              Background reminders fire even when closed — full PWA support on Chrome / Edge / Brave.
            </Note>
          </div>
        )}

        {platform === 'ios' && (
          <div className="mt-5">
            <Steps
              heading="iOS Safari"
              steps={[
                ['Tap the Share button at the bottom of Safari', <Share size={14} key="s" />],
                ['Scroll down and tap "Add to Home Screen"', <Home size={14} key="h" />],
                ['Tap "Add" — Daily Pulse will appear on your home screen', null],
              ]}
            />
            <Note>
              On iOS 16.4+ in-app reminders chime fully.
              Background notifications when the app is fully closed need a push server, which this build doesn't run.
              While the app is open you'll always get the modal + chime.
            </Note>
          </div>
        )}

        {platform === 'other' && (
          <div className="mt-5">
            {bipEvent ? (
              <button onClick={installAndroid} className="btn-primary w-full justify-center">
                <Download size={16} /> Install on this device
              </button>
            ) : (
              <Steps
                heading="Desktop / other"
                steps={[
                  ['Look for the install icon in your address bar', <Download size={14} key="d" />],
                  ['Or open the browser menu and choose "Install Daily Pulse"', null],
                ]}
              />
            )}
          </div>
        )}

        <button onClick={onClose} className="btn-ghost w-full justify-center mt-5">
          Maybe later
        </button>
      </div>
    </div>
  );
}

function Steps({ heading, steps }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">{heading}</div>
      <ol className="space-y-2">
        {steps.map(([text, icon], i) => (
          <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
            <div className={cn('size-6 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 text-white grid place-items-center text-xs font-bold shrink-0')}>
              {i + 1}
            </div>
            <div className="flex-1 text-sm flex items-center gap-2 flex-wrap">
              <span>{text}</span>
              {icon && <span className="text-slate-500">{icon}</span>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Note({ children }) {
  return (
    <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">{children}</p>
  );
}

InstallPrompt.shouldShow = () => !isStandalone();
