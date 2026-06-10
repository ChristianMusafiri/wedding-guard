import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // 🌟 Ajout de useLocation

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 🌟 Pour lire le signal de redirection

  // 🌟 ÉTATS DU POP-UP DE COMPTE EN ATTENTE
  const [showPopup, setShowPopup] = useState(false);
  const [pendingUser, setPendingUser] = useState('');

  // 1. CONFIGURATION DU COMPTE À REBOURS
  const weddingDate = new Date('June 18, 2026 15:00:00').getTime();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // 🌟 DÉTECTION DU SIGNAL DE COMPTE EN ATTENTE
  useEffect(() => {
    if (location.state && location.state.showPendingPopup) {
      setShowPopup(true);
      setPendingUser(location.state.pendingUsername || '');
      
      // Nettoyage de l'état de l'historique du navigateur
      // Pour éviter que le pop-up ne se ré-affiche si l'utilisateur rafraîchit la page manuellement !
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = weddingDate - now;

      if (difference < 0) {
        clearInterval(timer);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [weddingDate]);

  const program = [
    { time: '14h30', title: 'Accueil des invités', desc: 'Arrivée des proches et installation dans les jardins.', icon: '🌸' },
    { time: '15h00', title: 'Bénédiction Nuptiale', desc: 'Échange des vœux et alliance sacrée.', icon: '⛪' },
    { time: '17h00', title: 'Cocktail de bienvenue', desc: 'Rafraîchissements et partage de souvenirs.', icon: '🥂' },
    { time: '19h00', title: 'Grande Réception & Dîner', desc: 'Ouverture du banquet et célébration festive.', icon: '✨' },
  ];

  const formatUsername = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans relative overflow-hidden selection:bg-amber-500/30">
      
      {/* EFFETS DE LUMIÈRE ROMANTIQUES */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-600/5 rounded-full blur-[150px]"></div>

      {/* BOUTON ACCÈS STAFF */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => navigate('/login')}
          className="bg-neutral-900/40 hover:bg-amber-500/10 border border-neutral-800 hover:border-amber-500/30 text-neutral-400 hover:text-amber-400 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-300"
        >
          Espace Staff
        </button>
      </div>

      {/* SECTION HERO */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-4 relative">
        <div className="max-w-3xl space-y-8">
          <span className="text-amber-500 text-xs font-semibold uppercase tracking-[0.3em] block">Célébration de l'Amour</span>
          <h1 className="text-6xl md:text-8xl font-serif text-amber-400/90 tracking-wide leading-tight">King & Queen</h1>
          <p className="text-neutral-400 text-lg md:text-xl font-light max-w-xl mx-auto italic leading-relaxed">
            « Deux âmes, un seul cœur. Nous vous invitons à célébrer avec nous le premier jour du reste de notre vie. »
          </p>
          <div className="w-12 h-[1px] bg-amber-500/40 mx-auto"></div>
          <div className="space-y-2">
            <p className="text-xl md:text-2xl font-serif text-neutral-200">Jeudi 18 Juin 2026</p>
            <p className="text-sm text-neutral-500 tracking-wider uppercase">Bukavu, RDC</p>
          </div>

          {/* COMPTE À REBOURS */}
          <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto pt-8">
            {[
              { value: timeLeft.days, label: 'Jours' },
              { value: timeLeft.hours, label: 'Heures' },
              { value: timeLeft.minutes, label: 'Minutes' },
              { value: timeLeft.seconds, label: 'Secondes' },
            ].map((unit, idx) => (
              <div key={idx} className="bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center shadow-lg">
                <span className="text-2xl md:text-4xl font-serif text-amber-400 font-bold">{String(unit.value).padStart(2, '0')}</span>
                <span className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest mt-1">{unit.label}</span>
              </div>
            ))}
          </div>

          <div className="pt-16 animate-bounce">
            <a href="#programme" className="text-neutral-600 hover:text-amber-400 transition-colors">
              <svg className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* SECTION DU PROGRAMME */}
      <section id="programme" className="py-24 px-4 bg-neutral-900/20 border-t border-neutral-900 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-2">
            <span className="text-amber-500 text-xs font-semibold uppercase tracking-[0.2em]">Déroulement</span>
            <h2 className="text-4xl font-serif text-neutral-200">Le Programme de la Fête</h2>
            <div className="w-12 h-[1px] bg-amber-500/40 mx-auto mt-4"></div>
          </div>

          <div className="relative border-l border-neutral-800 ml-4 md:ml-32 space-y-12">
            {program.map((item, index) => (
              <div key={index} className="relative pl-8 group">
                <span className="absolute -left-5 top-1.5 w-10 h-10 bg-neutral-950 border border-neutral-800 group-hover:border-amber-500/50 rounded-full flex items-center justify-center text-lg shadow-lg transition-all duration-300">{item.icon}</span>
                <div className="space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <span className="text-amber-500 font-serif font-bold text-lg">{item.time}</span>
                    <span className="hidden md:inline text-neutral-700">•</span>
                    <h3 className="text-lg font-serif text-neutral-100 group-hover:text-amber-400 transition-colors duration-300">{item.title}</h3>
                  </div>
                  <p className="text-neutral-400 text-sm max-w-xl leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-neutral-900 text-center text-xs text-neutral-600 bg-neutral-950 z-10">
        <p className="font-serif tracking-widest text-neutral-500">King & Queen • 18.06.2026</p>
        <p className="mt-2">Conçu de manière sécurisée avec Wedding Guard CM2-12 © {new Date().getFullYear()}</p>
      </footer>

      {/* 🌟 LE POP-UP DE COMPTE EN ATTENTE CHIC (MODAL) */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-neutral-900/90 border border-neutral-850 max-w-md w-full rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
            
            {/* Décoration dorée en arrière-plan du modal */}
            <div className="absolute top-[-30%] left-[-30%] w-48 h-48 bg-amber-500/10 rounded-full blur-2xl"></div>

            {/* Icône clignotante élégante */}
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-8 w-8 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            {/* Titre & Message */}
            <h3 className="text-2xl font-serif text-amber-400 mb-3">Bonjour {formatUsername(pendingUser)} !</h3>
            <p className="text-neutral-200 text-sm leading-relaxed mb-6">
              Votre demande d'inscription a bien été reçue. Votre compte est actuellement <span className="text-amber-500 font-bold">en attente d'approbation</span> par l'organisateur du mariage.
            </p>
            <p className="text-neutral-400 text-xs leading-relaxed mb-8">
              Dès que le Boss aura activé votre accès, vous pourrez vous connecter pour utiliser l'application de scan. En attendant, profitez des détails du mariage !
            </p>

            {/* Bouton de fermeture */}
            <button
              onClick={() => setShowPopup(false)}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 font-bold py-3 px-4 rounded-lg transition-all duration-300 uppercase tracking-widest text-xs"
            >
              Découvrir le site du mariage
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;