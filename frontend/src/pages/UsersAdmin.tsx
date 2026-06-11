import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

interface User {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SCANNER' | 'MC';
  isActive: boolean;
  canEdit: boolean;
  createdAt: string;
}

const UsersAdmin: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  //  SUGGESTION  : Fonction pour formater proprement le nom (ex: "AMAZON" -> "Amazon")
  const formatUsername = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err: any) {
      setError("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (id: string, currentActive: boolean, role: string, canEdit: boolean) => {
    try {
      await api.patch(`/users/${id}`, {
        isActive: !currentActive,
        role: role,
        canEdit: canEdit
      });
      setUsers(users.map(u => u.id === id ? { ...u, isActive: !currentActive } : u));
    } catch (err) {
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  const handleRoleChange = async (id: string, newRole: any, currentActive: boolean, canEdit: boolean) => {
    try {
      await api.patch(`/users/${id}`, {
        isActive: currentActive,
        role: newRole,
        canEdit: canEdit
      });
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      alert("Erreur lors du changement de rôle.");
    }
  };

  // Activer / Désactiver le droit d'édition
  const handleEditPermissionChange = async (id: string, currentCanEdit: boolean, role: string, isActive: boolean) => {
    try {
      await api.patch(`/users/${id}`, {
        isActive: isActive,
        role: role,
        canEdit: !currentCanEdit
      });
      setUsers(users.map(u => u.id === id ? { ...u, canEdit: !currentCanEdit } : u));
    } catch (err) {
      alert("Erreur lors de la mise à jour des droits.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;

    try {
      const response = await api.patch(`/users/${selectedUserForPassword.id}/reset-password`, {
        passwordPlain: newPassword
      });
      setPasswordSuccess(response.data.message);
      setNewPassword('');
      setTimeout(() => {
        setSelectedUserForPassword(null);
        setPasswordSuccess(null);
      }, 3000);
    } catch (err) {
      alert("Erreur lors de la réinitialisation.");
    }
  };

  const isCurrentSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
          <div>
            {/* SUGGESTION  : Titre renommé */}
            <h1 className="text-3xl font-serif text-amber-400">Gestion des utilisateurs</h1>
            <p className="text-neutral-400 text-sm mt-1">Espace de contrôle des rôles et des accès SaaS.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-950/40 border border-red-800/60 text-red-400 rounded-lg text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-950 text-neutral-400 text-xs uppercase tracking-widest border-b border-neutral-800">
                  <th className="px-6 py-4">Nom d'utilisateur</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4">Statut Approbation</th>
                  <th className="px-6 py-4">Droit d'édition</th>

                  {/*  SUGGESTION  : On cache le titre de la colonne Actions si l'utilisateur n'est pas Super Admin */}
                  {isCurrentSuperAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {users.map((item) => {
                  const isMe = currentUser?.id === item.id;
                  const isSuperAdminTarget = item.role === 'SUPER_ADMIN';
                  const isEditingDisabled = isMe || (isSuperAdminTarget && !isCurrentSuperAdmin);

                  return (
                    <tr key={item.id} className="hover:bg-neutral-850/40 transition-colors">
                      
                      {/* Nom d'utilisateur formaté (Capitalized) */}
                      <td className="px-6 py-4 font-semibold text-neutral-200 flex items-center gap-2">
                        {formatUsername(item.username)} {/* Formatage appliqué ici */}
                        {isMe && (
                          <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-bold">
                            VOUS
                          </span>
                        )}
                      </td>
                      
                      {/* Sélecteur de rôle */}
                      <td className="px-6 py-4">
                        {isSuperAdminTarget ? (
                          <span className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-full font-bold">
                            PROPRIÉTAIRE CM2-12
                          </span>
                        ) : (
                          <select
                            value={item.role}
                            disabled={isEditingDisabled}
                            onChange={(e) => handleRoleChange(item.id, e.target.value, item.isActive, item.canEdit)}
                            className="bg-neutral-950 border border-neutral-800 text-neutral-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="ADMIN">ADMIN (Organisateur)</option>
                            <option value="SCANNER">SCANNER (Hôtes(Hôtesse) d'acceuil )</option>
                            <option value="MC">MC (Maître Cérémonie)</option>
                          </select>
                        )}
                      </td>

                      {/* Statut Approbation */}
                      <td className="px-6 py-4">
                        {isSuperAdminTarget ? (
                          <span className="text-xs text-neutral-500">Toujours actif</span>
                        ) : (
                          <button
                            disabled={isEditingDisabled}
                            onClick={() => handleStatusChange(item.id, item.isActive, item.role, item.canEdit)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border disabled:opacity-50 disabled:cursor-not-allowed ${
                              item.isActive
                                ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 animate-pulse'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            {item.isActive ? 'APPROUVÉ ET ACTIF' : 'EN ATTENTE'}
                          </button>
                        )}
                      </td>

                       {/* SÉLECTEUR DE SÉCURITÉ DE MODIFICATION (canEdit) */}
                       <td className="px-6 py-4">
                        {isSuperAdminTarget ? (
                          <span className="text-xs text-amber-500 font-bold">Autorisé d'office</span>
                        ) : (
                          <button
                            disabled={!isCurrentSuperAdmin} // Seul le SUPER_ADMIN peut modifier cette case !
                            onClick={() => handleEditPermissionChange(item.id, item.canEdit, item.role, item.isActive)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border ${
                              item.canEdit
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:bg-neutral-850'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {item.canEdit ? 'AUTORISÉ À MODIFIER' : '🔒 LECTURE SEULE'}
                          </button>
                        )}
                      </td>



                      {/*  SUGGESTION  : On cache complètement la cellule Actions pour l'Admin */}
                      {isCurrentSuperAdmin && (
                        <td className="px-6 py-4 text-right">
                          {!isSuperAdminTarget && (
                            <button
                              onClick={() => setSelectedUserForPassword(item)}
                              className="bg-neutral-950 hover:bg-amber-500/10 border border-neutral-800 hover:border-amber-500/30 text-neutral-400 hover:text-amber-400 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                            >
                              Réinitialiser le mot de passe
                            </button>
                          )}
                        </td>
                      )}

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de réinitialisation de mot de passe */}
        {selectedUserForPassword && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-serif text-amber-400 mb-2">Modifier le mot de passe</h3>
              <p className="text-neutral-400 text-xs mb-6">
                Définissez un nouveau mot de passe pour l'utilisateur <span className="text-neutral-200 font-semibold">{formatUsername(selectedUserForPassword.username)}</span>.
              </p>

              {passwordSuccess ? (
                <div className="p-4 bg-green-950/40 border border-green-800/60 text-green-400 text-sm rounded-lg text-center mb-4">
                  {passwordSuccess}
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
                      placeholder="Saisissez le nouveau mot de passe"
                    />
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-neutral-800 mt-6">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForPassword(null)}
                      className="flex-1 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-neutral-950 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UsersAdmin;