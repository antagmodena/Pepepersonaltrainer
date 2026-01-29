'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    const dismissed = localStorage.getItem('installPromptDismissed');
    
    if (isStandalone || dismissed) {
      setShowPrompt(false);
      return;
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
    setShowPrompt(true);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('installPromptDismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-dark-blue)] to-[var(--color-blue)] z-50">
        <div className="max-w-lg mx-auto">
          <div className="text-center text-white mb-3">
            <p className="font-bold text-lg">📲 Scarica l'App!</p>
            <p className="text-sm text-blue-100">Installa Padel Trainer sul tuo telefono</p>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full bg-white text-[var(--color-blue)] font-bold py-4 px-6 rounded-xl text-lg shadow-lg hover:bg-blue-50 transition-all"
          >
            SCARICA L'APP GRATIS
          </button>
          <button
            onClick={handleDismiss}
            className="w-full text-blue-200 text-sm mt-2 py-2"
          >
            Non ora, continua sul sito
          </button>
        </div>
      </div>

      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-center text-[var(--color-dark-blue)] mb-6">
              Come installare su iPhone
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-[var(--color-light)] rounded-xl">
                <span className="text-3xl">1️⃣</span>
                <div>
                  <p className="font-semibold">Apri in Safari</p>
                  <p className="text-sm text-[var(--color-gray)]">Copia il link e aprilo in Safari (bussola blu)</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-[var(--color-light)] rounded-xl">
                <span className="text-3xl">2️⃣</span>
                <div>
                  <p className="font-semibold">Tocca Condividi</p>
                  <p className="text-sm text-[var(--color-gray)]">Icona quadrata con freccia in basso</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-[var(--color-light)] rounded-xl">
                <span className="text-3xl">3️⃣</span>
                <div>
                  <p className="font-semibold">Aggiungi a Home</p>
                  <p className="text-sm text-[var(--color-gray)]">Scorri e tocca "Aggiungi a Home"</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText('https://pepepersonaltrainer.vercel.app');
                alert('Link copiato! Ora apri Safari e incollalo');
              }}
              className="w-full btn-primary mt-6"
            >
              Copia il link
            </button>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full text-[var(--color-gray)] mt-3 py-2"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
