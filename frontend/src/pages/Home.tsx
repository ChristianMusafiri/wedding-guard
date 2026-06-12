import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api'; // 🌟 Utilisation de votre instance API sécurisée

interface VipGuest {
  id: string;
  firstName: string;
  lastName: string;
  tableNumber: string | null;
  checkedInSeats: number;
  allowedSeats: number;
  checkInTime: string;
  scans: { id: string; scannedAt: string }[];
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // États d'authentification et alertes d'hôtesses
  const [showPopup, setShowPopup] = useState(false);
  const [pendingUser, setPendingUser] = useState('');

  // 1. CONFIGURATION DU COMPTE À REBOURS (Date finale : 18 Juin 2026)
  const weddingDate = new Date('June 18, 2026 15:00:00').getTime();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // États du lecteur de musique
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ÉTATS DU RSVP INTERACTIF
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [rsvpStep, setRsvpStep] = useState<1 | 2 | 3>(1);
  const [rsvpFirstName, setRsvpFirstName] = useState('');
  const [rsvpLastName, setRsvpLastName] = useState('');
  const [foundGuest, setSelectedGuest] = useState<VipGuest | null>(null);
  const [attendingSeats, setAttendingSeats] = useState(1);
  const [rsvpStatus, setRsvpStatus] = useState<'CONFIRMED' | 'DECLINED'>('CONFIRMED');
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  // Détection du signal de redirection staff en attente
  useEffect(() => {
    if (location.state && (location.state as { showPendingPopup?: boolean; pendingUsername?: string }).showPendingPopup) {
      setShowPopup(true);
      setPendingUser((location.state as { pendingUsername?: string }).pendingUsername ?? '');
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Initialisation du Timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = weddingDate - now;
      if (diff < 0) { clearInterval(timer); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [weddingDate]);

  // 🌟 L'AUDIO FONCTIONNEL (Mélodie instrumentale au violon de mariage)
  useEffect(() => {
    audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.35;
    return () => { audioRef.current?.pause(); };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleRsvpSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpError(null);
    setRsvpLoading(true);
    try {
      const response = await api.get('/public-rsvp/search', {
        params: { firstName: rsvpFirstName.trim(), lastName: rsvpLastName.trim().toUpperCase() },
      });
      setSelectedGuest(response.data as VipGuest);
      setAttendingSeats((response.data as VipGuest).allowedSeats);
      setRsvpStep(2);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setRsvpError(msg ?? "Nom introuvable sur la liste d'honneur.");
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleRsvpConfirm = async () => {
    if (!foundGuest) return;
    setRsvpError(null);
    setRsvpLoading(true);
    try {
      await api.post('/public-rsvp/confirm', {
        id: foundGuest.id,
        status: rsvpStatus,
        attendingSeats: rsvpStatus === 'CONFIRMED' ? Number(attendingSeats) : 0,
      });
      setRsvpStep(3);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setRsvpError(msg ?? 'Erreur de validation.');
    } finally {
      setRsvpLoading(false);
    }
  };

  const formatUsername = (name: string) => name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : '';
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-10 px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #120b05 0%, #080808 50%, #120606 100%)' }}
    >
      {/* Lueur ambiante */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(232,103,58,0.04) 0%, transparent 70%)' }} />

      {/* BOUTONS ACCÈS & MUSIQUE */}
      <div className="absolute top-5 right-5 z-40 flex gap-3">
        <button
          onClick={toggleMusic}
          title={isPlaying ? 'Pause' : 'Musique'}
          className="w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300"
          style={{
            background: 'rgba(20,12,4,0.7)',
            borderColor: isPlaying ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)',
            color: isPlaying ? '#d4af37' : '#666',
          }}
        >
          {isPlaying ? (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          )}
        </button>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 border"
          style={{
            background: 'rgba(20,12,4,0.7)',
            borderColor: 'rgba(255,255,255,0.08)',
            color: 'rgba(200,180,140,0.6)',
          }}
        >
          Espace Staff
        </button>
      </div>

      <div className="w-full max-w-lg flex flex-col items-center gap-6">

        {/* 🌟 LE COMPTE À REBOURS DU MARIAGE PLACÉ AU-DESSUS ET SANS BORDURES SOUHAITÉES */}
        <div className="w-full grid grid-cols-4 gap-3 px-2">
          {[
            { value: timeLeft.days, label: 'Jours' },
            { value: timeLeft.hours, label: 'Heures' },
            { value: timeLeft.minutes, label: 'Min' },
            { value: timeLeft.seconds, label: 'Sec' },
          ].map((u, i) => (
            <div key={i} className="flex flex-col items-center justify-center py-2.5">
              <span
                className="text-3xl font-bold font-mono tracking-tight"
                style={{ color: '#d4af37', fontFamily: "'Cormorant Garamond', serif" }}
              >
                {pad(u.value)}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] mt-0.5" style={{ color: 'rgba(212,175,55,0.4)' }}>
                {u.label}
              </span>
            </div>
          ))}
        </div>

        {/* FAIRE-PART PRINCIPAL (Plaque d'acrylique d'une propreté absolue) */}
        <div
          className="w-full relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 30px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
            minHeight: '680px',
          }}
        >
          {/* Contenu central de l'acrylique */}
          <div className="relative z-10 flex flex-col items-center text-center px-10 py-12 space-y-6">

            {/* Famille */}
            <div className="space-y-1.5">
              <p className="text-[13px] uppercase tracking-[0.25em] font-semibold" style={{ color: 'rgba(212,175,55,0.6)', fontFamily: "'Cormorant Garamond', serif" }}>
                La famille
              </p>
              <p className="text-sm font-bold tracking-wider uppercase leading-snug" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: "'Playfair Display', serif" }}>
                MANGHE NAMUHANDA
              </p>
              <p className="text-[13px] italic leading-relaxed" style={{ color: 'rgba(220,205,175,0.75)', fontFamily: "'Cormorant Garamond', serif", maxWidth: '320px' }}>
                et Josephine NZAMU a le réel plaisir de vous inviter aux cérémonies de mariage de leur fille
              </p>
              <p className="text-[14px] font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: "'Playfair Display', serif" }}>
                MUGOLI NAMUHANDA Jessica
              </p>
              <p className="text-[13px] italic" style={{ color: 'rgba(220,205,175,0.7)', fontFamily: "'Cormorant Garamond', serif" }}>
                qui s'unit à son bien aimé
              </p>
              <p className="text-[14px] font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: "'Playfair Display', serif" }}>
                Fabrice MUSIMWA
              </p>
              <p className="text-[13px] italic leading-normal" style={{ color: 'rgba(220,205,175,0.65)', fontFamily: "'Cormorant Garamond', serif", maxWidth: '340px' }}>
                fils de MUSIMWA AMULI Jean Paul et MULASHI MUKOMAPI Madeleine
              </p>
            </div>

            {/* Séparateur or délicat */}
            <div className="flex items-center gap-3 w-4/5">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.3))' }} />
              <div className="w-1 h-1 rounded-full" style={{ background: '#d4af37', opacity: 0.5 }} />
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(212,175,55,0.3))' }} />
            </div>

            {/* Noms principaux */}
            <div className="leading-none space-y-0.5">
              <h1 style={{ fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(3.5rem, 11vw, 5rem)', color: '#f0e8d0', textShadow: '0 2px 20px rgba(212,175,55,0.2)' }}>
                Mugoli
              </h1>
              <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(2rem, 7vw, 3rem)', color: '#d4af37' }}>
                &amp;
              </p>
              <h1 style={{ fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(3rem, 11vw, 4rem)', color: '#f0e8d0' }}>
                Fabrice
              </h1>
            </div>

            {/* Date d'honneur */}
            <div className="py-2.5 px-6 rounded-xl" style={{ border: '1px solid rgba(212,175,55,0.18)', background: 'rgba(212,175,55,0.03)' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.2rem, 3.5vw, 1.6rem)', color: '#f0e8d0', letterSpacing: '0.15em', fontWeight: 600 }}>
                18 | JUIN | 2026
              </p>
              <p className="text-[13px] uppercase tracking-[0.25em] mt-0.5" style={{ color: '#d4af37', fontFamily: "'Cormorant Garamond', serif" }}>
                SALLE BODEGA / BUKAVU, RDC
              </p>
            </div>

            {/* Titre du Programme */}
            <h3 style={{ fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(2.2rem, 8vw, 2rem)', color: '#f0e8d0', textShadow: '0 2px 15px rgba(212,175,55,0.15)' }}>
              Programme des Cérémonies
            </h3>

            {/* Grille du Programme 2x2 */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {[
                { date: '14/06/2026 · 14H00', title: 'Remise de la Dot', desc: 'Chez Papa MANGHE, Av. du Gouverneur.' },
                { date: '17/06/2026 · 14H00', title: 'Mariage Civil', desc: 'À MUHUMBA chez KANTINTIMA sis Av. LUNDULA N°116.' },
                { date: '18/06/2026 · 19H00', title: "Fête d'Au revoir", desc: 'Célébration dans la salle BODEGA.' },
                { date: '21/06/2026 · 13H00', title: 'Mariage Religieux', desc: "À l'Église Tente d'assignation." },
              ].map((item, i) => (
                <div key={i} className="p-3.5 rounded-xl space-y-1 transition-all duration-300 border hover:border-amber-500/25" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(212,175,55,0.12)' }}>
                  <span className="text-[13px] font-bold font-mono block" style={{ color: '#d4af37' }}>
                    {item.date}
                  </span>
                  <h4 className="text-m font-semibold" style={{ color: '#f0e8d0', fontFamily: "'Playfair Display', serif" }}>
                    {item.title}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,185,155,0.7)', fontFamily: "'Cormorant Garamond', serif" }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Dress Code Requis */}
            <div className="w-full pt-4 rounded-xl p-4 text-left space-y-3" style={{ background: 'rgba(212,175,55,0.02)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <h3 className="text-center text-[13px] font-bold uppercase tracking-[0.25em]" style={{ color: '#d4af37', fontFamily: "'Cormorant Garamond', serif" }}>
                ✦ Dress Code Requis ✦
              </h3>
              <ul className="space-y-2">
                {[
                  { event: 'Dot', code: 'Bazin' },
                  { event: 'Mariage Civil', code: 'Monocouleur (de la tête aux pieds — couleur de votre choix)' },
                  { event: "Fête d'Au revoir", code: 'Rouge Bordeaux' },
                  { event: 'Mariage Religieux', code: 'Noir & Blanc (tenue de ville ou Uniforme)' },
                ].map((dc, i) => (
                  <li key={i} className="flex gap-2 text-x">
                    <span style={{ color: '#d4af37', flexShrink: 0 }}>◆</span>
                    <p style={{ color: 'rgba(200,185,155,0.8)', fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem' }}>
                      <span style={{ color: '#f0e8d0', fontWeight: 700 }}>{dc.event} :</span>{' '}{dc.code}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bouton RSVP d'Action */}
            <div className="pt-2">
              <button
                onClick={() => { setShowRsvpModal(true); setRsvpStep(1); setRsvpError(null); }}
                className="relative overflow-hidden px-8 py-3.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 hover:scale-105 active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #c8902a 50%, #b87e1e 100%)',
                  color: '#1a0f00',
                  boxShadow: '0 4px 24px rgba(212,175,55,0.25)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  fontFamily: "'Cormorant Garamond', serif",
                  letterSpacing: '0.18em',
                }}
              >
                ✦ Confirmer ma présence (RSVP) ✦
              </button>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <footer className="py-6 text-center space-y-1">
          <p style={{ color: 'rgba(212,175,55,0.4)', fontFamily: "'Great Vibes', cursive", fontSize: '1rem' }}>
            Mugoli &amp; Fabrice • 18.06.2026
          </p>
          <p className="text-[9px] tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.1)' }}>
            Conçu avec Wedding Guard || CM2 12 © {new Date().getFullYear()}
          </p>
        </footer>

      </div>

      {/* MODALE RSVP INTERACTIVE */}
      {showRsvpModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)' }}>
          <div className="max-w-md w-full rounded-2xl p-8 relative overflow-hidden animate-fade-in" style={{ background: 'linear-gradient(145deg, #1c1408 0%, #130e06 100%)', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(212,175,55,0.1)' }}>
            <button onClick={() => setShowRsvpModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors" style={{ color: 'rgba(212,175,55,0.5)', background: 'rgba(255,255,255,0.04)' }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {rsvpStep === 1 && (
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <h3 style={{ fontFamily: "'Great Vibes', cursive", fontSize: '2rem', color: '#d4af37' }}>Rechercher mon invitation</h3>
                  <p className="text-xs" style={{ color: 'rgba(200,185,155,0.7)', fontFamily: "'Cormorant Garamond', serif" }}>Saisissez vos informations pour charger vos places réservées.</p>
                </div>
                {rsvpError && (
                  <div className="p-3 rounded-lg text-xs text-center" style={{ background: 'rgba(180,30,30,0.15)', border: '1px solid rgba(200,50,50,0.3)', color: '#f87171' }}>
                    ⚠ {rsvpError}
                  </div>
                )}
                <form onSubmit={handleRsvpSearch} className="space-y-4">
                  {[
                    { label: 'Prénom', value: rsvpFirstName, setter: setRsvpFirstName, ph: 'ex : Jean' },
                    { label: 'Nom de famille', value: rsvpLastName, setter: setRsvpLastName, ph: 'ex : DUPONT' },
                  ].map(({ label, value, setter, ph }) => (
                    <div key={label}>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(212,175,55,0.7)', fontFamily: "'Cormorant Garamond', serif" }}>{label}</label>
                      <input type="text" required value={value} onChange={(e) => setter(e.target.value)} placeholder={ph} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.2)', color: '#f0e8d0', fontFamily: "'Cormorant Garamond', serif" }} />
                    </div>
                  ))}
                  <button type="submit" disabled={rsvpLoading} className="w-full py-3 rounded-lg text-[13px] font-bold uppercase tracking-widest transition-all" style={{ background: 'linear-gradient(135deg, #d4af37, #b87e1e)', color: '#1a0f00', fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.2em', opacity: rsvpLoading ? 0.7 : 1 }}>
                    {rsvpLoading ? 'Chargement...' : 'Vérifier mon accès →'}
                  </button>
                </form>
              </div>
            )}

            {rsvpStep === 2 && foundGuest && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <span className="inline-block text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }}>Invitation trouvée</span>
                  <h3 style={{ fontFamily: "'Great Vibes', cursive", fontSize: '1.8rem', color: '#f0e8d0' }}>Bonjour {formatUsername(foundGuest.firstName)} !</h3>
                  <p className="text-xs" style={{ color: 'rgba(200,185,155,0.7)', fontFamily: "'Cormorant Garamond', serif" }}>Votre invitation est valable pour <span style={{ color: '#d4af37', fontWeight: 700 }}>{foundGuest.allowedSeats} personne(s)</span>.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['CONFIRMED', 'DECLINED'] as const).map((s) => (
                    <button key={s} onClick={() => setRsvpStatus(s)} className="p-4 rounded-xl text-[10px] font-bold uppercase tracking-wider flex flex-col items-center gap-2 transition-all" style={{ background: rsvpStatus === s ? s === 'CONFIRMED' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)', border: rsvpStatus === s ? s === 'CONFIRMED' ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.07)', color: rsvpStatus === s ? s === 'CONFIRMED' ? '#4ade80' : '#f87171' : 'rgba(180,160,120,0.5)', fontFamily: "'Cormorant Garamond', serif" }}>
                      <span className="text-xl">{s === 'CONFIRMED' ? '🌸' : '😔'}</span>
                      {s === 'CONFIRMED' ? 'Je serai présent' : 'Je serai absent'}
                    </button>
                  ))}
                </div>
                {rsvpStatus === 'CONFIRMED' && (
                  <div className="p-4 rounded-xl text-center space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.12)' }}>
                    <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(212,175,55,0.7)', fontFamily: "'Cormorant Garamond', serif" }}>Nombre de personnes présentes</label>
                    <div className="flex items-center justify-center gap-5">
                      <button onClick={() => setAttendingSeats(Math.max(1, attendingSeats - 1))} className="w-9 h-9 rounded-lg text-lg font-bold flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>−</button>
                      <span className="text-2xl font-bold font-mono w-10" style={{ color: '#f0e8d0' }}>{attendingSeats}</span>
                      <button onClick={() => setAttendingSeats(Math.min(foundGuest.allowedSeats, attendingSeats + 1))} className="w-9 h-9 rounded-lg text-lg font-bold flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>+</button>
                    </div>
                    <p className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(212,175,55,0.4)' }}>Max : {foundGuest.allowedSeats} places</p>
                  </div>
                )}
                {rsvpError && (
                  <div className="p-3 rounded-lg text-xs text-center" style={{ background: 'rgba(180,30,30,0.15)', border: '1px solid rgba(200,50,50,0.3)', color: '#f87171' }}>⚠ {rsvpError}</div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setRsvpStep(1)} className="flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(200,185,155,0.6)', fontFamily: "'Cormorant Garamond', serif" }}>Retour</button>
                  <button onClick={handleRsvpConfirm} disabled={rsvpLoading} className="flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all" style={{ background: 'linear-gradient(135deg, #d4af37, #b87e1e)', color: '#1a0f00', fontFamily: "'Cormorant Garamond', serif", opacity: rsvpLoading ? 0.7 : 1 }}>{rsvpLoading ? 'Validation...' : 'Confirmer mon RSVP'}</button>
                </div>
              </div>
            )}

            {rsvpStep === 3 && foundGuest && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#d4af37' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 style={{ fontFamily: "'Great Vibes', cursive", fontSize: '2rem', color: '#d4af37' }}>RSVP Enregistré !</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,185,155,0.85)', fontFamily: "'Cormorant Garamond', serif" }}>
                    {rsvpStatus === 'CONFIRMED' ? `Merci ! Votre présence avec ${attendingSeats} personne(s) a bien été confirmée.` : "Merci d'avoir pris le temps de nous informer. Vous nous manquerez le jour J !"}
                  </p>
                </div>
                <button onClick={() => setShowRsvpModal(false)} className="w-full py-3 rounded-lg text-[13px] font-bold uppercase tracking-widest" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.2)', color: 'rgba(212,175,55,0.7)', fontFamily: "'Cormorant Garamond', serif" }}>Fermer l'invitation</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(14px)' }}>
          <div className="max-w-md w-full rounded-2xl p-8 relative text-center" style={{ background: 'linear-gradient(145deg, #1c1408 0%, #130e06 100%)', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 30px 80px rgba(0,0,0,0.8)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <svg className="h-8 w-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#d4af37' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Great Vibes', cursive", fontSize: '2rem', color: '#d4af37' }}>Bonjour {formatUsername(pendingUser)} !</h3>
            <p className="text-sm leading-relaxed mt-3 mb-2" style={{ color: 'rgba(220,205,175,0.85)', fontFamily: "'Cormorant Garamond', serif" }}>Votre demande d'inscription a bien été reçue. Votre compte est actuellement <span style={{ color: '#d4af37', fontWeight: 700 }}>en attente d'approbation</span>.</p>
            <p className="text-xs leading-relaxed mb-6" style={{ color: 'rgba(180,165,130,0.6)', fontFamily: "'Cormorant Garamond', serif" }}>Dès que le Boss aura activé votre accès, vous pourrez vous connecter pour scanner. En attendant, profitez des détails du mariage !</p>
            <button onClick={() => setShowPopup(false)} className="w-full py-3 rounded-lg text-[13px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #d4af37, #b87e1e)', color: '#1a0f00', fontFamily: "'Cormorant Garamond', serif" }}>Découvrir le site du mariage</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;