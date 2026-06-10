import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/api';

import { useNavigate } from 'react-router-dom';

interface GlobalStats {
  totalInvitations: number;
  totalExpectedSeats: number;
  totalCheckedInSeats: number;
  totalMissingSeats: number;
  presencePercentage: number;
  vips: {
    total: number;
    present: number;
    missing: number;
  };
}

interface RecentScan {
  id: string;
  scannedAt: string;
  status: string;
  notes: string;
  guest: {
    firstName: string;
    lastName: string;
    tableNumber: string | null;
    isVip: boolean;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour charger les données
  const loadDashboardData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      
      // Requêtes parallèles vers nos API NestJS
      const [statsRes, scansRes] = await Promise.all([
        api.get('/stats/global'),
        api.get('/stats/recent?limit=5')
      ]);

      setStats(statsRes.data);
      setRecentScans(scansRes.data);
      setError(null);
    } catch (err) {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Chargement initial + Système de polling (Temps réel toutes les 5 secondes)
  useEffect(() => {
    loadDashboardData(true);

    const interval = setInterval(() => {
      loadDashboardData(false); // Mise à jour silencieuse en arrière-plan
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Formater l'heure de scan (ex: "22h15")
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Formater les noms
  const formatName = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Calcul du cercle SVG de progression
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = stats 
    ? circumference - (stats.presencePercentage / 100) * circumference 
    : circumference;

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* Sidebar de navigation */}
      <Sidebar />

      {/* Contenu Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* EN-TÊTE */}
        <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-3xl font-serif text-amber-400">Tableau de bord de l'événement</h1>
            <p className="text-neutral-400 text-sm mt-1">Données et statistiques de présence en temps réel.</p>
          </div>
          {/* Indicateur de synchronisation temps réel */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-full">
            <span className="w-2,5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-xs font-semibold text-neutral-400 tracking-wider">LIVE FEED</span>
          </div>
        </div>

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
          stats && (
            <div className="space-y-8">
              
              {/* SECTION GRAPHIQUE & APERÇU GLOBAL */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 🌟 LE CERCLE DE PROGRESSION RADIAL (Presence %) */}
                <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute top-[-20%] left-[-20%] w-48 h-48 bg-amber-500/5 rounded-full blur-3xl"></div>
                  
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-6">Taux de Présence</h3>
                  
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Cercle arrière-plan grise */}
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        className="stroke-neutral-800 fill-none"
                        strokeWidth="10"
                      />
                      {/* Cercle doré de progression */}
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        className="stroke-amber-500 fill-none transition-all duration-1000 ease-out"
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Texte au milieu */}
                    <div className="absolute text-center">
                      <span className="text-4xl font-bold font-mono text-neutral-100">{stats.presencePercentage}%</span>
                      <span className="block text-[10px] text-neutral-500 uppercase tracking-wider mt-1">Sallon plein</span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 mt-6 leading-relaxed">
                    Calculé sur un total attendu de <span className="text-neutral-300 font-semibold">{stats.totalExpectedSeats} personnes</span>.
                  </p>
                </div>

                {/* 📊 LES CARTES D'INDICATEURS CLÉS (KPIs) */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                  {[
                    {
                      title: "Invitations",
                      value: stats.totalInvitations,
                      desc: "Cartons d'accès uniques",
                      icon: "✉️",
                      color: "border-neutral-800"
                    },
                    {
                      title: "Présences validées",
                      value: stats.totalCheckedInSeats,
                      desc: "Personnes dans la salle",
                      icon: "",
                      color: "border-green-500/30 text-green-400"
                    },
                    {
                      title: "Places manquantes",
                      value: stats.totalMissingSeats,
                      desc: "Personnes encore attendues",
                      icon: "",
                      color: "border-yellow-500/30 text-yellow-500"
                    },
                    {
                      title: "VIPs Arrivés",
                      value: `${stats.vips.present} / ${stats.vips.total}`,
                      desc: "Personnes d'honneur présentes",
                      icon: "",
                      color: "border-amber-500/30 text-amber-500"
                    }
                  ].map((card, idx) => (
                    <div key={idx} className={`bg-neutral-900 border ${card.color.split(' ')[0]} rounded-2xl p-6 flex flex-col justify-between shadow-xl hover:scale-[1.01] transition-transform duration-300`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{card.title}</p>
                          <p className="text-3xl font-bold font-mono text-neutral-100 mt-2">{card.value}</p>
                        </div>
                        <span className="text-2xl">{card.icon}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-4 border-t border-neutral-850 pt-3">{card.desc}</p>
                    </div>
                  ))}
                </div>

              </div>

              {/* 🕒 SECTION FLUX LIVE DES DERNIERS SCANS */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-serif text-amber-400">Flux d'entrée en temps réel</h3>
                    <button 
                      onClick={() => navigate('/live-feed-admin')}
                      className="text-xs bg-neutral-950 hover:bg-amber-500/10 border border-neutral-800 hover:border-amber-500/30 text-neutral-400 hover:text-amber-400 px-3 py-1.5 rounded-lg font-bold transition-all duration-300 uppercase tracking-wider"
                    >
                     Voir le journal complet →
                    </button>
                  <span className="text-xs text-neutral-500">Mise à jour instantanée</span>
                </div>

                {recentScans.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 italic text-sm">
                    Aucun scan enregistré pour le moment. La fête va bientôt commencer !
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-850">
                    {recentScans.map((scan) => (
                      <div key={scan.id} className="py-4 flex justify-between items-center hover:bg-neutral-850/20 px-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-4">
                          {/* Heure du scan */}
                          <span className="text-sm font-mono text-amber-500 font-bold bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-lg">
                            {formatTime(scan.scannedAt)}
                          </span>
                          <div>
                            {/* Nom de l'invité */}
                            <p className="text-sm font-semibold text-neutral-200 uppercase flex items-center gap-2">
                               {formatName(scan.guest.firstName)} {scan.guest.lastName}
                              {scan.guest.isVip && (
                                <span className="text-[8px] bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
                                  VIP
                                </span>
                              )}
                            </p>
                            {/* Notes d'entrée */}
                            <p className="text-xs text-neutral-500 mt-0.5">{scan.notes}</p>
                          </div>
                        </div>

                        {/* Numéro de table orienté */}
                        <div className="text-right">
                          <p className="text-xs text-neutral-400 font-semibold">Table de placement</p>
                          <p className="text-sm font-bold text-amber-500 mt-0.5 font-mono">
                            {scan.guest.tableNumber || 'Table libre'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )
        )}
      </main>
    </div>
  );
};

export default Dashboard;