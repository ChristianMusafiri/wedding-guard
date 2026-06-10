import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  allowedSeats: number;
  checkedInSeats: number;
  qrCodeToken: string;
  tableNumber: string | null;
  isVip: boolean;
  isCheckedIn: boolean;
}

const Scan: React.FC = () => {
  const { user, logout } = useAuth();
  
  // États pour les modes de scan
  const [activeTab, setActiveTab] = useState<'camera' | 'usb' | 'manual'>('camera');
  //const [cameraError, setCameraError] = useState<string | null>(null);
  
  // État de recherche manuelle
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [manualLoading, setManualLoading] = useState(false);

  // État du modal de validation (Groupe / Partiel)
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [enteringSeats, setEnteringSeats] = useState(1);
  const [scanToken, setScanToken] = useState<string | null>(null);

  // États pour l'écran de feedback (Verdicts)
  const [feedback, setFeedback] = useState<{
    type: 'SUCCESS' | 'PARTIAL' | 'ERROR' | 'ALREADY_SCANNED';
    title: string;
    message: string;
    details?: any;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  // ÉCOUTE DU SCANNER USB (Clavier HID)
  const barcodeBuffer = useRef<string>('');
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si on est en mode USB, on intercepte toutes les frappes rapides
      if (activeTab !== 'usb') return;

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 5) {
          triggerVerification(barcodeBuffer.current);
        }
        barcodeBuffer.current = ''; // Reset
      } else {
        // Ignorer les touches système comme Shift, Control, etc.
        if (e.key.length === 1) {
          barcodeBuffer.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // INITIALISATION DU SCANNER APPAREIL PHOTO (html5-qrcode)
  useEffect(() => {
    if (activeTab !== 'camera' || feedback) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 15, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear(); // Arrêter le scanneur temporairement
        triggerVerification(decodedText);
      },
      () => {
        // Erreurs d'analyse silencieuses (recherche de QR en cours)
      }
    );

    return () => {
      scanner.clear().catch(err => console.error("Erreur de nettoyage scanner", err));
    };
  }, [activeTab, feedback]);

  // RECHERCHE MANUELLE DANS LA BASE DE DONNÉES
  useEffect(() => {
    if (activeTab !== 'manual') return;
    
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        setManualLoading(true);
        const response = await api.get('/guests');
        // Filtrer localement
        const filtered = response.data.filter((g: Guest) =>
          g.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.lastName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error("Erreur de recherche");
      } finally {
        setManualLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, activeTab]);

  // DÉCLENCHER LE PROTOCOLE DE VÉRIFICATION AVEC LE BACKEND
  const triggerVerification = async (token: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      // 1. Décoder temporairement le token pour voir combien de places sont autorisées
      // Le token ressemble à : id:UUID|name:NOM|sig:SIGNATURE
      const parts = token.split('|sig');
      const payload = parts[0];
      const idPart = payload.split('|')[0];
      const guestId = idPart.split(':')[1];

      // Récupérer l'état de l'invité en DB pour préparer le choix des places
      const response = await api.get(`/guests/${guestId}`);
      const guest = response.data;

      // Ouvrir le panneau de validation des places
      setScanToken(token);
      setSelectedGuest(guest);
      const remaining = guest.allowedSeats - guest.checkedInSeats;
      setEnteringSeats(remaining > 0 ? remaining : 1);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "QR Code non reconnu ou falsifié !";
      setFeedback({
        type: 'ERROR',
        title: 'ACCÈS REFUSÉ',
        message: errMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  // SOUMETTRE LA VALIDATION DU SCAN
  const submitScan = async () => {
    if (!scanToken) return;
    setLoading(true);
    try {
      const response = await api.post('/scan', {
        token: scanToken,
        enteringSeats: Number(enteringSeats),
      });

      const { status, message, guest } = response.data;

      setFeedback({
        type: status === 'SUCCESS' ? 'SUCCESS' : 'PARTIAL',
        title: status === 'SUCCESS' ? 'ACCÈS PARTIEL' : 'ACCÈS AUTORISÉ',
        message: message,
        details: guest,
      });
      setSelectedGuest(null);
      setScanToken(null);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Une erreur est survenue lors de la validation.";
      setFeedback({
        type: err.response?.data?.status === 'ALREADY_SCANNED' ? 'ALREADY_SCANNED' : 'ERROR',
        title: 'ALERTE SECURITÉ',
        message: errMsg,
      });
      setSelectedGuest(null);
      setScanToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans">
      
      {/* EN-TÊTE CHIC STYLE APPLICATION MOBILE */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex justify-between items-center z-10">
        <div>
          <h2 className="text-lg font-serif text-amber-400 tracking-wider">Wedding Guard Scanner</h2>
          <p className="text-neutral-500 text-[10px] uppercase tracking-widest mt-0.5">Hôte(Hôtesse) d'accueil : {user?.username.toUpperCase()}</p>
        </div>
        <button
          onClick={logout}
          className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider"
        >
          Sortir
        </button>
      </header>

      {/* SYSTÈME D'ONGLETS SANS FILTRE */}
      <div className="flex border-b border-neutral-800 bg-neutral-900/40 print:hidden">
        {[
          { id: 'camera', label: 'Appareil Photo 📷' },
          { id: 'usb', label: 'Scanner USB 🔌' },
          { id: 'manual', label: 'Recherche Nom 🔎' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setFeedback(null);
              setSelectedGuest(null);
            }}
            className={`flex-1 text-center py-4 text-xs font-bold uppercase tracking-wider transition-all duration-300 border-b-2 ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ZONE CENTRALE DYNAMIQUE */}
      <main className="flex-1 p-6 flex flex-col justify-center items-center relative">
        
        {/* CHARGEMENT EN COURS */}
        {loading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        )}

        {/* 1. INTERFACE CAMERA */}
        {activeTab === 'camera' && !feedback && !selectedGuest && (
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-4 overflow-hidden shadow-2xl text-center">
            <p className="text-neutral-400 text-xs uppercase tracking-widest mb-4">Positionnez le QR Code devant l'objectif</p>
            <div id="reader" className="overflow-hidden rounded-xl bg-black"></div>
          </div>
        )}

        {/* 2. INTERFACE USB SCANNER */}
        {activeTab === 'usb' && !feedback && !selectedGuest && (
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-serif text-neutral-100">Prêt pour le Scan USB</h3>
              <p className="text-neutral-400 text-xs mt-2 leading-relaxed">
                Connectez votre pistolet de scan via USB. Visez et flashez le code d'invitation. Les données seront validées automatiquement.
              </p>
            </div>
          </div>
        )}

        {/* 3. INTERFACE RECHERCHE MANUELLE */}
        {activeTab === 'manual' && !feedback && !selectedGuest && (
          <div className="w-full max-w-md flex flex-col space-y-4 h-[450px]">
            <input
              type="text"
              placeholder="Saisissez le nom ou prénom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-amber-500 text-sm placeholder-neutral-500"
            />

            <div className="flex-1 bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-y-auto divide-y divide-neutral-850">
              {manualLoading ? (
                <div className="p-8 text-center text-xs text-neutral-500 animate-pulse">Recherche en cours...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 italic">Saisissez au moins 2 lettres de l'invité.</div>
              ) : (
                searchResults.map((guest) => (
                  <div key={guest.id} className="p-4 flex justify-between items-center hover:bg-neutral-850/40">
                    <div>
                      <p className="text-sm font-semibold text-neutral-100 uppercase">{guest.firstName} {guest.lastName}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Table : {guest.tableNumber || 'Sans table'} • Places : {guest.checkedInSeats}/{guest.allowedSeats}
                      </p>
                    </div>
                    {guest.isCheckedIn ? (
                      <span className="text-[10px] bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded-full font-bold">COMPLET</span>
                    ) : (
                      <button
                        onClick={() => triggerVerification(guest.qrCodeToken)}
                        className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold px-4 py-1.5 rounded-lg text-xs uppercase tracking-wider"
                      >
                        Scanner
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 🌟 MODAL DE SÉLECTION DES PLACES (GROUPE / PARTIEL) */}
        {selectedGuest && (
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-xl font-serif text-neutral-100 ">{selectedGuest.firstName}</h3>
              <h3 className="text-2xl font-serif text-neutral-300 uppercase">{selectedGuest.lastName}</h3>
            </div>
            
            <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-xl">
              <p className="text-xs text-neutral-500 uppercase tracking-widest">Table assignée</p>
              <p className="text-lg font-bold text-amber-400 mt-1">{selectedGuest.tableNumber || 'Table libre'}</p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Combien de personnes entrent à cet instant ?
              </label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setEnteringSeats(Math.max(1, enteringSeats - 1))}
                  className="w-12 h-12 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xl font-bold flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="text-3xl font-bold font-mono text-neutral-100 w-16">{enteringSeats}</span>
                <button
                  onClick={() => setEnteringSeats(Math.min(selectedGuest.allowedSeats - selectedGuest.checkedInSeats, enteringSeats + 1))}
                  className="w-12 h-12 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xl font-bold flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-[11px] text-neutral-500">
                Déjà entrés : {selectedGuest.checkedInSeats} / {selectedGuest.allowedSeats} places autorisées au total.
              </p>
            </div>

            <div className="flex gap-4 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setSelectedGuest(null)}
                className="flex-1 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={submitScan}
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg"
              >
                Valider l'entrée
              </button>
            </div>
          </div>
        )}

        {/* 🌟 ÉCRANS DE FEEDBACK MAJESTUEUX (SUCCESS, PARTIAL, ERROR, ALREADY_SCANNED) */}
        {feedback && (
          <div className={`w-full max-w-md rounded-2xl p-8 text-center border shadow-2xl relative overflow-hidden ${
            feedback.type === 'SUCCESS'
              ? 'bg-green-950/40 border-green-800/80 text-green-200'
              : feedback.type === 'PARTIAL'
              ? 'bg-yellow-950/40 border-yellow-800/80 text-yellow-200'
              : 'bg-red-950/40 border-red-800/80 text-red-200 animate-pulse'
          }`}>
            
            {/* Icône du verdict */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border ${
              feedback.type === 'SUCCESS' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
              feedback.type === 'PARTIAL' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
              'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {feedback.type === 'SUCCESS' && (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {feedback.type === 'PARTIAL' && (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {(feedback.type === 'ERROR' || feedback.type === 'ALREADY_SCANNED') && (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>

            {/* Verdict */}
            <h3 className={`text-2xl font-serif mb-2 ${
              feedback.type === 'SUCCESS' ? 'text-green-400' :
              feedback.type === 'PARTIAL' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {feedback.title}
            </h3>
            
            <p className="text-sm leading-relaxed mb-6 text-neutral-300">{feedback.message}</p>

            {/* Détails de l'invité (si valide) */}
            {feedback.details && (
              <div className="bg-black/40 border border-neutral-800/40 p-4 rounded-xl text-left space-y-2 mb-6 text-xs text-neutral-300">
                <p><span className="text-neutral-500 uppercase font-semibold">Invité :</span> {feedback.details.firstName} {feedback.details.lastName}</p>
                <p><span className="text-neutral-500 uppercase font-semibold">Table :</span> {feedback.details.tableNumber || 'Non assignée'}</p>
                <p><span className="text-neutral-500 uppercase font-semibold">Places validées :</span> {feedback.details.checkedInSeats} / {feedback.details.allowedSeats}</p>
              </div>
            )}

            <button
              onClick={() => setFeedback(null)}
              className={`w-full font-bold py-3 px-4 rounded-xl transition-all duration-300 uppercase tracking-widest text-xs ${
                feedback.type === 'SUCCESS'
                  ? 'bg-green-500 hover:bg-green-600 text-neutral-950 shadow-lg shadow-green-500/10'
                  : feedback.type === 'PARTIAL'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-neutral-950 shadow-lg shadow-yellow-500/10'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/10'
              }`}
            >
              Scanner le suivant
            </button>
          </div>
        )}

      </main>
    </div>
  );
};

export default Scan;