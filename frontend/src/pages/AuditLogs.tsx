import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/api';

interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  targetName: string;
  userName: string;
  details: string;
  createdAt: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stats/audit-logs');
      setLogs(response.data);
    } catch (err) {
      setError("Impossible de charger le journal d'audit.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* EN-TÊTE */}
        <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-3xl font-serif text-amber-400">Journal d'Audit Sécurisé</h1>
            <p className="text-neutral-400 text-sm mt-1">Traçabilité complète des créations, modifications et suppressions d'invités.</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full">
            <span className="text-xs font-bold text-amber-500 tracking-widest uppercase">AUDIT TRAIL LOGS</span>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-950/40 border border-red-800 text-red-400 rounded-lg text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-neutral-500 italic">
            Aucune action de modification ou de suppression n'a été enregistrée pour le moment.
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-950 text-neutral-400 text-xs uppercase tracking-widest border-b border-neutral-800">
                  <th className="px-6 py-4">Date & Heure</th>
                  <th className="px-6 py-4">Auteur</th>
                  <th className="px-6 py-4">Type Action</th>
                  <th className="px-6 py-4">Cible</th>
                  <th className="px-6 py-4">Détails de l'opération</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-850/40 transition-colors text-sm">
                    
                    {/* Date et Heure */}
                    <td className="px-6 py-4 font-mono text-neutral-400">
                      {formatTime(log.createdAt)}
                    </td>

                    {/* Auteur de l'action */}
                    <td className="px-6 py-4 font-semibold text-neutral-200 uppercase">
                      {log.userName}
                    </td>

                    {/* Badge type d'action */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        log.action === 'CREATE' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                        log.action === 'UPDATE' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Nom de l'invité cible */}
                    <td className="px-6 py-4 font-semibold text-neutral-300 uppercase">
                      {log.targetName}
                    </td>

                    {/* Description détaillée */}
                    <td className="px-6 py-4 text-xs text-neutral-400 leading-relaxed max-w-md">
                      {log.details}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
};

export default AuditLogs;