import React, { useEffect, useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/api';

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

interface VipCounter {
  total: number;
  present: number;
  missing: number;
}

interface VipAlert {
  guestId: string;
  firstName: string;
  lastName: string;
  tableNumber: string | null;
  checkedInSeats: number;
  allowedSeats: number;
  waveNumber: number;
  isFirstWave: boolean; 
}

const McFeed: React.FC = () => {
  const [vips, setVips] = useState<VipGuest[]>([]);
  const [vipStats, setVipStats] = useState<VipCounter | null>(null); // compteur de Vip added
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Systeme de file d'attente (many vips entrance at the same time)
  const [alertQueue, setAlertQueue] = useState<VipAlert[]>([]);
  const [activateAlert, setActiveAlert] = useState<VipAlert | null>(null);
  
  
  // État pour le dernier VIP arrivé (Alerte plein écran)
  //const [latestVip, setLatestVip] = useState<VipGuest | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  // Référence pour garder en mémoire l'ID du dernier VIP traité(new = search guest)
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(10); // by default 10
  
  // Références de contrôle de synchronisation
  const announcedScansMap = useRef<{ [guestId: string]: number }>({});

  //const lastProcessedVipId = useRef<string | null>(null);

 // const isFirstLoad = useRef(true);

  // SYNTHÉTISEUR AUDIO NATIF (Génère un carillon doré chic)
  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Note 1 (Mi)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain1.gain.setValueAtTime(0.1, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      
      // Note 2 (Sol# - accord majeur doré)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(830.61, ctx.currentTime + 0.15); // G#5
      gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.15);

      osc1.start();
      osc1.stop(ctx.currentTime + 1);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 1.15);
    } catch (e) {
      console.error("Audio bloqué par les restrictions du navigateur.");
    }
  };

  // VIBRATION DU SMARTPHONE (Haptic feedback)
  const triggerVibration = () => {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]); // Deux vibrations courtes de 200ms
    }
  };

  // Référence pour détecter si c'est le tout premier chargement de la page
  const isFirstLoad = useRef(true);

  // Charger le flux des VIPs
  const fetchVipFeed = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const [feedRes, statsRes] = await Promise.all ([
        api.get('/stats/mc-feed'),
        api.get('/stats/global')
      ]);
      const vipList: VipGuest[] = feedRes.data;
      
      setVips(vipList);
      setVipStats(statsRes.data.vips); // Recupere les compteurs VIP (TOATAL,PRESENT,MISSING)
      setError(null);

      // LOGIQUE TEMPS RÉEL : Détecter un nouveau VIP fraîchement entré
      const tempNewAlerts: VipAlert[] = [];

      vipList.forEach((vip) => {
        const currentScanCount = vip.scans.length;
        const previousScanCount = announcedScansMap.current[vip.id] || 0;

        if (isFirstLoad.current) {
          // Au premier démarrage de l'écran, on initialise juste la carte en mémoire
          // pour éviter de lancer des alertes sur les VIPs déjà installés avant l'ouverture de la page
          announcedScansMap.current[vip.id] = currentScanCount;
        } else {
          // Si on détecte de nouveaux scans (qu'il s'agisse d'une nouvelle personne ou de retardataires)
          if (currentScanCount > previousScanCount) {
            // On prépare une alerte et on l'empile dans notre tableau temporaire
            tempNewAlerts.push({
              guestId: vip.id,
              firstName: vip.firstName,
              lastName: vip.lastName,
              tableNumber: vip.tableNumber,
              checkedInSeats: vip.checkedInSeats,
              allowedSeats: vip.allowedSeats,
              waveNumber: currentScanCount,
              isFirstWave: currentScanCount <= 1,
            });
            // Mettre à jour notre référence locale de scan
            announcedScansMap.current[vip.id] = currentScanCount;
          }
        }
      });

      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }

      // S'il y a de nouveaux scans détectés durant cette session de polling,
      // on les ajoute à la suite de la file d'attente globale (Zustand/State local)
      if (tempNewAlerts.length > 0) {
        // Tri chronologique ascendant pour que le premier arrivé soit annoncé en premier (FIFO)
        tempNewAlerts.reverse();
        setAlertQueue((prevQueue) => [...prevQueue, ...tempNewAlerts]);
      }

    } catch (err) {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };


  // Initialisation + Polling toutes les 3 secondes (Ultra réactif pour le MC)
    useEffect(() => {
    if (!showAlert && alertQueue.length > 0) {
      const nextAlert = alertQueue[0]; // On prend le premier de la liste
      setActiveAlert(nextAlert);
      setShowAlert(true);
      playChime();
      triggerVibration();
      
      // On retire cet élément de la liste d'attente
      setAlertQueue((prevQueue) => prevQueue.slice(1));
    }
  }, [alertQueue, showAlert]);

  useEffect(() => {
    fetchVipFeed(true);

    const interval = setInterval(() => {
      fetchVipFeed(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatName = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Filtrage des Vips en temps reel
  const filteredVips = vips
    .filter((vip) => 
      vip.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vip.firstName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, limit === -1 ? vips.length : limit); // -1 means displayall 
      
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* Sidebar commune */}
      <Sidebar />

      {/* Contenu Principal */}
      <main className="flex-1 p-8 overflow-y-auto relative">
        
        {/* EFFET DE LUMIÈRE DE SCÈNE */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* EN-TÊTE DE LA CONSOLE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-3xl font-serif text-amber-400">Maître de Cérémonie</h1>
            <p className="text-neutral-400 text-sm mt-1">Flux d'annonces VIP en direct. Gardez l'écran actif en main</p>
          </div>
          {/* a supprimer start */}
         <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
            <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">MC LIVE MODE</span>
          </div>
        </div>
        {/* a supprimer end */}

                  {/*  ZONE D'INDICATEURS DE SÉCURITÉ VIP EN TEMPS RÉEL */}
          {vipStats && (
            <div className="flex items-center gap-3">
              {/* Badge 1 : Compteur de VIPs */}
              <div className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-500 ${
                vipStats.missing === 0
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                <span className="text-sm"></span>
                {vipStats.missing === 0 ? (
                  <span>VIP  ({vipStats.present}/{vipStats.total})</span>
                ) : (
                  <span>VIP  {vipStats.present} / {vipStats.total} (ATTENDUS)</span>
                )}
              </div>

              {/* Badge 2 : Signal Live */}
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-full">
                <span className={`w-2 h-2 rounded-full ${vipStats.missing === 0 ? 'bg-green-500' : 'bg-amber-500 animate-ping'}`}></span>
                <span className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase">
                  {vipStats.missing === 0 ? 'Bon boulot! La liste VIP est au complet' : 'MC LIVE MODE'}
                </span>
              </div>
            </div>
          )}


        {error && (
          <div className="p-4 mb-6 bg-red-950/40 border border-red-800/60 text-red-400 rounded-lg text-center animate-pulse">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* PANNEAU GAUCHE : LE DERNIER ARRIVÉ (Affiche géante pour annonce micro) */}
            <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
              
              <div>
                {/*a supprimeer start */}
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full font-bold tracking-widest uppercase animate-pulse">
                  Dernier VIP Arrivé à {formatTime(vips[0].checkInTime)}
                </span>
                {/* a supprimer end */}

                {/* Vague d'arrivée dynamique sur la carte principale */}
                {vips.length > 0 && (
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold tracking-widest uppercase animate-pulse border ${
                    vips[0].scans.length <= 1 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  }`}>
                    {vips[0].scans.length <= 1 ? '👑 Première Entrée' : `Complément (Entrée N°${vips[0].scans.length})`}
                  </span>
                )}
                {/* ... */}

                {vips.length === 0 ? (
                  <div className="mt-16 text-center text-neutral-500 italic text-sm">
                    Aucun VIP n'est encore entré. Les annonces commenceront dès le premier scan.
                  </div>
                ) : (
                  <div className="mt-8 space-y-6">
                    <div className="space-y-1">
                      <p className="text-[11px] text-neutral-500 uppercase tracking-widest">
                        {vips[0].scans.length <= 1 ? "Préparez l'annonce de bienvenue de :" : "Annoncez l'arrivée des retardataires de :"}
                      </p>
                      <h2 className="text-4xl text-amber-400">{formatName(vips[0].firstName)}</h2>
                      <p className="text-4xl font-serif text-neutral-100 uppercase font-bold leading-tight">
                        {vips[0].lastName}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-neutral-850">
                      <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-xl">
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Installer à</span>
                        <span className="text-base font-bold text-neutral-200 font-mono mt-1 block">
                          {vips[0].tableNumber || 'Table -libre-'}
                        </span>
                      </div>
                      <div className="bg-neutral-950 p-4 border border-neutral-850 rounded-xl">
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Accompagnateurs</span>
                        <span className="text-base font-bold text-neutral-200 font-mono mt-1 block">
                          {vips[0].checkedInSeats} / {vips[0].allowedSeats} pers.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {vips.length > 0 && (
                <div className="mt-12 pt-4 border-t border-neutral-850 text-xs text-neutral-500 flex justify-between items-center">
                  <span>Enregistré à {formatTime(vips[0].checkInTime)}</span>
                  <button 
                    onClick={playChime}
                    className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]"
                  >
                    🔊 Tester le son
                  </button>
                </div>
              )}
            </div>

            {/* PANNEAU DROIT : HISTORIQUE CHRONOLOGIQUE DES VIPs EN SÉCURITÉ */}
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col h-[600px]">
              
              {/* En-tête de contrôle de liste */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-neutral-850">
                <h3 className="text-lg font-serif text-amber-400">Liste chronologique des VIPs installés</h3>
                
                {/* FILTRES EN TEMPS RÉEL DU MC */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Chercher un VIP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 placeholder-neutral-600 w-40"
                  />
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value={10}>Afficher 10</option>
                    <option value={30}>Afficher 30</option>
                    <option value={-1}>Tout afficher</option>
                  </select>
                </div>
              </div>


              {vips.length === 0 ? (
                <div className="p-12 text-center text-neutral-500 italic text-sm">
                  En attente des invités de marque...
                </div>
              ) : filteredVips.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-neutral-500 italic text-sm">
                  Aucun résultat pour "{searchTerm}".
                </div>

              ) : (
                <div className="divide-y divide-neutral-850 overflow-y-auto max-h-[450px]">
                  {filteredVips.map((vip, index) => (
                    <div key={vip.id} className={`py-4 flex justify-between items-center px-4 rounded-xl transition-all duration-300 ${
                      index === 0 && searchTerm === '' ? 'bg-amber-500/5 border border-amber-500/10' : 'hover:bg-neutral-850/20'
                    }`}>
                      <div className="flex items-center gap-4">
                        {/* Heure d'entrée */}
                        <span className="text-xs font-mono font-bold text-amber-500">
                          {formatTime(vip.checkInTime)}
                        </span>
                        <div>
                          <p className="normal-case text-sm font-medium text-neutral-400">
                            {vip.firstName} <span className="font-semibold text-neutral-200 uppercase">{formatName(vip.lastName)}</span>
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Accompagné de {vip.checkedInSeats - 1} personne(s)
                            <span className={`font-semibold ml-2 font-mono ${vip.checkedInSeats === vip.allowedSeats ? 'text-green-500' : 'text-blue-400'}`}>
                              ({vip.checkedInSeats === vip.allowedSeats ? `COMPLET ${vip.scans.length} : ${vip.checkedInSeats}/${vip.allowedSeats}` : `PARTIEL ${vip.scans.length} : ${vip.checkedInSeats}/${vip.allowedSeats}`})
                            </span>
                          </p>

                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">Placement</span>
                        <span className="text-sm font-bold text-amber-500 font-mono mt-0.5 block">
                          {vip.tableNumber || 'Table -libre'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* L'ALERTE MAJESTUEUSE PLEIN ÉCRAN (FLASH DE SCÈNE) */}
        {showAlert && activateAlert && (
          <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-xl flex items-center justify-center p-6 z-50 animate-fade-in">
            
            {/* Effet gyrophare doré en tâche de fond */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent animate-pulse pointer-events-none"></div>

            <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
              
              <div className="w-24 h-24 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-2xl shadow-amber-500/20">
                <svg className="h-12 w-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>

              <div className="space-y-2">
                {/* En-tête d'alerte selon la file d'attente */}
                <span className="text-amber-500 text-s font-bold uppercase tracking-[0.4em] block animate-pulse">
                    {activateAlert.isFirstWave ? ' ALERTE ENTRÉE VIP EN DIRECT !' : ` ALERTE (ENTRÉE N°${activateAlert.waveNumber}) RETARDATAIRES VIP `}
                </span>
                <h2 className="text-6xl text-amber-400 font-light">{formatName(activateAlert.firstName)}</h2>
                <p className="text-6xl md:text-7xl font-serif text-neutral-100 uppercase font-bold leading-tight tracking-wide">
                  {activateAlert.lastName}
                </p>
                
              </div>

              <div className="w-16 h-[1px] bg-amber-500/30 mx-auto"></div>

              <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-xl">
                  <span className="text-xs text-neutral-500 uppercase tracking-widest">Table Assignée</span>
                  <span className="text-xl font-bold text-neutral-200 font-mono mt-1 block">
                    {activateAlert.tableNumber || 'Non assignée'}
                  </span>
                </div>
                <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-xl">
                  <span className="text-xs text-neutral-500 uppercase tracking-widest">Places Occupées</span>
                  <span className="text-xl font-bold text-neutral-200 font-mono mt-1 block">
                    {activateAlert.checkedInSeats} / {activateAlert.allowedSeats}
                  </span>
                </div>
              </div>
              {/* BOUTON DYNAMIQUE D'EFFACEMENT / SUIVANT */}
              <div className="max-w-md mx-auto">
                <button
                 onClick={() => setShowAlert(false)}
                 className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] uppercase tracking-widest text-xs shadow-lg shadow-amber-500/20"
                >
                  { alertQueue.length > 0 
                      ? `Annonce Effectuée • Suivant (${alertQueue.length} en attente)` 
                      : 'Annonce Effectuée • Fermer' }
                </button>

                  {alertQueue.length > 0 && (
                     <p className="text-s text-neutral-500 mt-3 animate-pulse">
                        ⚠️ {alertQueue.length} autre(s) VIP attendent leur annonce dans la file.
                     </p>
                   )}
               </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default McFeed;