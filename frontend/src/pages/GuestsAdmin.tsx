import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  allowedSeats: number;
  checkedInSeats: number;
  qrCodeToken: string;
  status: string;
  tableNumber: string | null;
  isVip: boolean;
  guestCategory: string | null;
  isCheckedIn: boolean;
}


const GuestsAdmin: React.FC = () => {
  const navigate = useNavigate(); 
  const { user: currentUser } = useAuth(); // Récupérer l'utilisateur connecté 
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États de notification d'erreurs (Modales/Toasts)
  const [modalError, setModalError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // États pour le formulaire de création
  const [showAddModal, setShowAddModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [allowedSeats, setAllowedSeats] = useState(1);
  const [tableNumber, setTableNumber] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [guestCategory, setGuestCategory] = useState('Général');

  // ÉTATS POUR LA MODIFICATION (EDIT) et suppression
  const [selectedGuestForEdit, setSelectedGuestForEdit] = useState<Guest | null>(null);
  const [selectedGuestForDelete, setSelectedGuestForDelete] = useState<Guest | null>(null);

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVip, setFilterVip] = useState('ALL'); // ALL, VIP, NORMAL
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PRESENT, ABSENT, PARTIAL

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/guests');
      const sorted = [...response.data].sort((a: Guest, b: Guest) => a.firstName.localeCompare(b.firstName)); // tri alphabet
      setGuests(sorted);
    } catch (err: any) {
      setError("Impossible de charger la liste des invités.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  // Soumission du formulaire d'ajout
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await api.post('/guests', {
        firstName,
        lastName: lastName.toUpperCase(),
        allowedSeats: Number(allowedSeats),
        tableNumber: tableNumber || undefined,
        isVip,
        guestCategory
      });

      // Ajouter le nouvel invité localement pour éviter un rechargement API , ajout tri 
      //const updatedList = [...guests, response.data].sort((a, b) => a.firstName.localeCompare(b.firstName));
      setGuests([...guests, response.data].sort((a, b) => a.firstName.localeCompare(b.firstName)));
      
      // Reset du formulaire et fermeture du modal
      setFirstName('');
      setLastName('');
      setAllowedSeats(1);
      setTableNumber('');
      setIsVip(false);
      setGuestCategory('Général');
      setShowAddModal(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erreur lors de la création";
      setModalError(Array.isArray(msg) ? msg[0] : msg);
    }
  };
    // ENREGISTRER LES MODIFICATIONS (EDIT)
  const handleEditGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuestForEdit) return;
    setModalError(null);

    try {
      const response = await api.patch(`/guests/${selectedGuestForEdit.id}`, {
        firstName: selectedGuestForEdit.firstName,
        lastName: selectedGuestForEdit.lastName.toUpperCase(),
        allowedSeats: Number(selectedGuestForEdit.allowedSeats),
        tableNumber: selectedGuestForEdit.tableNumber || null,
        isVip: selectedGuestForEdit.isVip,
        guestCategory: selectedGuestForEdit.guestCategory
      });

      // Mettre à jour l'état local
      setGuests(guests.map(g => g.id === selectedGuestForEdit.id ? response.data : g)
                      .sort((a, b) => a.firstName.localeCompare(b.firstName))
       );
      setSelectedGuestForEdit(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erreur lors de la modification de l'invité.";
      setModalError(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  //  SUPPRIMER UN INVITÉ (SUPER_ADMIN UNIQUEMENT) user canEdit by Sup. 
  const submitDeleteGuest = async () => {
    if (!selectedGuestForDelete) return;

    try {
      await api.delete(`/guests/${selectedGuestForDelete.id}`);
      setGuests(guests.filter(g => g.id !== selectedGuestForDelete.id));
      setSelectedGuestForDelete(null);
    } catch (err) {
      setGlobalError("Erreur lors de la suppression de l'invité.");
      setSelectedGuestForDelete(null);
    }
  };


  //  FILTRAGE DYNAMIQUE DES INVITÉS
  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = 
      guest.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest.tableNumber && guest.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesVip = 
      filterVip === 'ALL' ? true :
      filterVip === 'VIP' ? guest.isVip : !guest.isVip;

    const matchesStatus = 
      filterStatus === 'ALL' ? true :
      filterStatus === 'PRESENT' ? guest.isCheckedIn :
      filterStatus === 'ABSENT' ? guest.checkedInSeats === 0 :
      guest.checkedInSeats > 0 && guest.checkedInSeats < guest.allowedSeats; // PARTIAL

    return matchesSearch && matchesVip && matchesStatus ;
  });

  const isCurrentSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
   //SÉCURISÉE : L'admin ne peut modifier que si SUPER_ADMIN ou s'il a canEdit = true !
  const canUserModify = isCurrentSuperAdmin || (currentUser?.canEdit === true);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      <Sidebar />

      <main className="flex-1 p-8">
         {/* Global Error Banner */}
        {globalError && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg text-center animate-bounce">
            {globalError}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-3xl font-serif text-amber-400">Gestion des invités</h1>
            <p className="text-neutral-400 text-sm mt-1">Gérez la liste de présence, attribuez les tables et surveillez les entrées.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/print-qrs')}
              className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/30 text-neutral-300 hover:text-amber-400 font-bold py-3 px-6 rounded-lg transition-all duration-300 uppercase tracking-wider text-xs"
            >
              Imprimer les QR Codes
            </button>

            <button
             disabled={!canUserModify}
             onClick={() => { setShowAddModal(true); setModalError(null); }}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] uppercase tracking-wider text-xs shadow-lg shadow-amber-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Ajouter un invité
            </button>
          </div>
        </div>
        {/* BARRE DE RECHERCHE ET FILTRES CHICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm placeholder-neutral-500"
          />
          <select
            value={filterVip}
            onChange={(e) => setFilterVip(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
          >
            <option value="ALL">Tous les types d'accès</option>
            <option value="VIP">VIP uniquement</option>
            <option value="NORMAL">Accès standard</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
          >
            <option value="ALL">Tous les statuts de présence</option>
            <option value="PRESENT">Complètement arrivés</option>
            <option value="PARTIAL">Arrivées partielles (Retardataires)</option>
            <option value="ABSENT">Pas encore arrivés (Absents)</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
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
                  <th className="px-6 py-4">Nom de l'invité</th>
                  <th className="px-6 py-4">Catégorie</th>
                  <th className="px-6 py-4">Table</th>
                  <th className="px-6 py-4 text-center">Places Occupées</th>
                  <th className="px-6 py-4 text-right">Statut d'entrée</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-neutral-850/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-neutral-200">
                          {guest.firstName} {guest.lastName}
                        </span>
                        {guest.isVip && (
                          <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-500 px-2 py-0.5 rounded-full font-bold tracking-widest uppercase animate-pulse">
                            VIP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-400">{guest.guestCategory || 'Général'}</td>
                    <td className="px-6 py-4 font-mono text-sm text-neutral-300">{guest.tableNumber || 'Non attribuée'}</td>
                    <td className="px-6 py-4 text-center font-semibold text-neutral-200">
                      {guest.checkedInSeats} / <span className="text-neutral-500">{guest.allowedSeats}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        guest.isCheckedIn
                          ? 'bg-green-500/10 border-green-500/30 text-green-400'
                          : guest.checkedInSeats > 0
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          guest.isCheckedIn ? 'bg-green-500' : guest.checkedInSeats > 0 ? 'bg-yellow-500' : 'bg-neutral-600'
                        }`}></span>
                        {guest.isCheckedIn ? 'COMPLET' : guest.checkedInSeats > 0 ? 'PARTIEL' : 'ABSENT'}
                      </span>
                    </td>
                    {/* BOUTONS DE MODIFICATION ET DE SUPPRESSION */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        {/* Bouton d'édition (Accessible Admin et Super Admin) */}
                        <button
                          disabled={!canUserModify} // Désactivé si pas canEdit !
                          onClick={() => {setSelectedGuestForEdit(guest); setModalError(null);}}
                          className="bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Modifier
                        </button>

                        {/*  Bouton de suppression (Uniquement SUPER_ADMIN) */}
                        {isCurrentSuperAdmin && (
                          <button
                            onClick={() => setSelectedGuestForDelete(guest)}
                            className="bg-red-950/20 hover:bg-red-950 border border-red-900/40 hover:border-red-800 text-red-400 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL AJOUT INVITÉ CHIC */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 border border-neutral-800 max-w-lg w-full rounded-2xl p-6 shadow-2xl">
              <h3 className="text-2xl font-serif text-amber-400 mb-2">Enregistrer un invité</h3>
              <p className="text-neutral-400 text-xs mb-6">Créez un nouvel accès unique. Le QR Code sera généré automatiquement.</p>

              {/* Bannière d'erreur dédiée (ex: Doublon) */}
              {modalError && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-400 text-xs rounded-lg text-center animate-pulse">
                  ⚠️ {modalError}
                </div>
              )}

              <form onSubmit={handleAddGuest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Nom</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
                      placeholder="ex: Christian"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Nom de famille</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
                      placeholder="ex: MUSAFIRI"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Nombre de places</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={allowedSeats}
                      onChange={(e) => setAllowedSeats(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Numéro de Table</label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
                      placeholder="ex: Table 12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Catégorie</label>
                  <select
                    value={guestCategory}
                    onChange={(e) => setGuestCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
                  >
                    <option value="Famille Marié">Famille Marié</option>
                    <option value="Famille Mariée">Famille Mariée</option>
                    <option value="Amis">Amis</option>
                    <option value="Collègues">Collègues</option>
                    <option value="Officiels / VIP">Officiels / VIP</option>
                    <option value="Général">Général</option>
                  </select>
                </div>

                {/* Option VIP */}
                <div className="bg-neutral-950/60 p-4 border border-neutral-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-200">Accès VIP Prioritaire</p>
                    <p className="text-xs text-neutral-500">Alertera le Maître de Cérémonie en direct lors de son entrée.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isVip}
                    onChange={(e) => setIsVip(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Boutons d'actions */}
                <div className="flex gap-4 pt-4 border-t border-neutral-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300"
                  >
                    Enregistrer l'invité
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
                {/* MODAL DE MODIFICATION (EDIT GUEST) */}
        {selectedGuestForEdit && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 border border-neutral-800 max-w-lg w-full rounded-2xl p-6 shadow-2xl">
              <h3 className="text-2xl font-serif text-amber-400 mb-2">Modifier l'invité</h3>
              <p className="text-neutral-400 text-xs mb-6">Corrigez les informations de l'invité.</p>

              {modalError && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-400 text-xs rounded-lg text-center animate-pulse">
                  ⚠️ {modalError}
                </div>
              )}

              <form onSubmit={handleEditGuest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Prénom</label>
                    <input
                      type="text"
                      required
                      value={selectedGuestForEdit.firstName}
                      onChange={(e) => setSelectedGuestForEdit({ ...selectedGuestForEdit, firstName: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Nom de famille</label>
                    <input
                      type="text"
                      required
                      value={selectedGuestForEdit.lastName}
                      onChange={(e) => setSelectedGuestForEdit({ ...selectedGuestForEdit, lastName: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Nombre de places</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={selectedGuestForEdit.allowedSeats}
                      onChange={(e) => setSelectedGuestForEdit({ ...selectedGuestForEdit, allowedSeats: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Numéro de Table</label>
                    <input
                      type="text"
                      value={selectedGuestForEdit.tableNumber || ''}
                      onChange={(e) => setSelectedGuestForEdit({ ...selectedGuestForEdit, tableNumber: e.target.value || null })}
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">Catégorie</label>
                  <select
                    value={selectedGuestForEdit.guestCategory || 'Général'}
                    onChange={(e) => setSelectedGuestForEdit({ ...selectedGuestForEdit, guestCategory: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 text-sm"
                  >
                    <option value="Famille Marié">Famille Marié</option>
                    <option value="Famille Mariée">Famille Mariée</option>
                    <option value="Amis">Amis</option>
                    <option value="Collègues">Collègues</option>
                    <option value="Officiels / VIP">Officiels / VIP</option>
                    <option value="Général">Général</option>
                  </select>
                </div>

                <div className="bg-neutral-950/60 p-4 border border-neutral-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-200">Accès VIP Prioritaire</p>
                    <p className="text-xs text-neutral-500">Alertera le Maître de Cérémonie en direct lors de son entrée.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedGuestForEdit.isVip}
                    onChange={(e) => setSelectedGuestForEdit({ ...selectedGuestForEdit, isVip: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-neutral-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedGuestForEdit(null)}
                    className="flex-1 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

         {/* NOUVELLE MODALE DE CONFIRMATION DE SUPPRESSION HYPER PROFESSIONNELLE (DORÉE & NOIRE) */}
        {selectedGuestForDelete && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 border border-neutral-800 max-w-md w-full rounded-2xl p-6 shadow-2xl text-center space-y-6">
              
              {/* Icône de danger */}
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <div>
                <h3 className="text-xl font-serif text-red-400">Confirmation de suppression</h3>
                <p className="text-neutral-400 text-xs mt-2 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer définitivement <span className="text-neutral-200 font-bold uppercase">"{selectedGuestForDelete.firstName} {selectedGuestForDelete.lastName}"</span> de la liste des invités ? 
                </p>
                <p className="text-[12px] text-red-500/80 mt-2">
                  ⚠️ Cette action est irréversible. Toutes ses données ainsi que celles de scan(si c'est fait) seront perdues.
                </p>
              </div>

              <div className="flex gap-4 pt-4 border-t border-neutral-850">
                <button
                  onClick={() => setSelectedGuestForDelete(null)}
                  className="flex-1 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={submitDeleteGuest}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-500/10"
                >
                  Supprimer
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default GuestsAdmin;