import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/api';

interface ScanLog {
  id: string;
  scannedAt: string;
  status: 'SUCCESS' | 'PARTIAL' | 'ALREADY_SCANNED' | 'INVALID_TOKEN';
  notes: string;
  guest?: {
    firstName: string;
    lastName: string;
    tableNumber: string | null;
    isVip: boolean;
    allowedSeats: number;
    checkedInSeats: number;
  };
}

const LiveFeedAdmin: React.FC = () => {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(50); // Par défaut 50 lignes

  const fetchLogs = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const response = await api.get(`/stats/logs?limit=${limit}&search=${searchTerm}`);
      setLogs(response.data);
      setError(null);
    } catch (err) {
      setError("Impossible de charger le flux des entrées.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Système de Polling (Mise à jour automatique toutes les 4 secondes)
  useEffect(() => {
    fetchLogs(true);
    const interval = setInterval(() => {
      fetchLogs(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [limit, searchTerm]); // Se relance si la limite ou la recherche change

  const formatName = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* EN-TÊTE */}
        <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-3xl font-serif text-amber-400">Flux d'entrée détaillé</h1>
            <p className="text-neutral-400 text-sm mt-1">Historique complet des scans d'accès en temps réel.</p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-xs font-bold text-green-400 tracking-widest uppercase">LIVE AUDIT ACTIVE</span>
          </div>
        </div>

        {/* RECHERCHE ET CONFIGURATION DE LA LIMITE */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Rechercher par nom de famille..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-3 bg-neutral-900 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-sm placeholder-neutral-500"
          />
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-sm font-semibold"
          >
            <option value={20}>Afficher 20 lignes</option>
            <option value={50}>Afficher 50 lignes</option>
            <option value={100}>Afficher 100 lignes</option>
            <option value={500}>Afficher Tout (500 max)</option>
          </select>
        </div>

        {error && <div className="p-4 mb-6 bg-red-950/40 border border-red-800 text-red-400 rounded-lg text-center">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="divide-y divide-neutral-850">
              {logs.map((scan) => (
                <div key={scan.id} className="p-5 flex justify-between items-center hover:bg-neutral-850/10 transition-colors">
                  <div className="flex items-center gap-5">
                    {/* Heure avec badge de couleur selon le statut */}
                    <span className={`text-xs font-mono font-bold px-3 py-2 rounded-lg border ${
                      scan.status === 'SUCCESS' ? 'bg-green-500/5 border-green-500/20 text-green-400' :
                      scan.status === 'PARTIAL' ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400' :
                      'bg-red-500/5 border-red-500/20 text-red-400 animate-pulse'
                    }`}>
                      {formatTime(scan.scannedAt)}
                    </span>
                    
                    <div>
                      {scan.guest ? (
                        <>
                          <p className="text-sm font-semibold text-neutral-200 uppercase flex items-center gap-2">
                            <span className="normal-case font-medium text-neutral-400">{formatName(scan.guest.firstName)}</span> {scan.guest.lastName} 
                            {scan.guest.isVip && (
                              <span className="text-[8px] bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">VIP</span>
                            )}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">{scan.notes}</p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-red-400">{scan.notes}</p>
                      )}
                    </div>
                  </div>

                  {scan.guest && (
                    <div className="text-right">
                      <p className="text-xs text-neutral-500 uppercase tracking-widest">Table assignée</p>
                      <p className="text-sm font-bold text-amber-500 font-mono mt-0.5">{scan.guest.tableNumber || 'Table libre'}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LiveFeedAdmin;